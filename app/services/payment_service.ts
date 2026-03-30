import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import Client from '#models/client'
import Product from '#models/product'
import { GatewayOne } from './gateways/gateway_one.js'
import { GatewayTwo } from './gateways/gateway_two.js'
import { type PaymentGateway, type PaymentRequest } from './gateways/payment_gateway.js'

@inject()
export class PaymentService {
  private gatewayInstances: Record<string, PaymentGateway> = {
    'Gateway 1': new GatewayOne(),
    'Gateway 2': new GatewayTwo(),
  }

  /**
   * Orchestrates the payment process across multiple gateways with fallback support.
   */
  public async processPayment(
    customer: { name: string; email: string },
    payment: { cardNumber: string; cvv: string; products: { id: number; quantity: number }[] }
  ) {
    const amount = await this.calculateTotal(payment.products)
    const activeGateways = await this.getActiveGatewaysSortedByPriority()

    if (!activeGateways.length) {
      throw new Error('No payment gateways configured or active')
    }

    // Use transaction for database operations
    const transaction = await db.transaction(async (trx) => {
      const client = await this.getOrCreateClient(customer, trx)
      const transactionModel = await this.createPendingTransaction(
        client.id,
        amount,
        payment.cardNumber,
        trx
      )
      await this.attachProductsToTransaction(transactionModel, payment.products, trx)

      const paymentRequest = this.buildPaymentRequest(client, payment, amount)

      let success = false
      let lastError = 'Unknown error'

      for (const gatewayModel of activeGateways) {
        const instance = this.gatewayInstances[gatewayModel.name]
        if (!instance) continue

        try {
          const result = await instance.pay(paymentRequest)

          if (result.success) {
            await this.finalizeTransaction(
              transactionModel,
              gatewayModel.id,
              result.externalId!,
              trx
            )
            success = true
            break
          }
          lastError = result.error || 'Payment failed'
        } catch (e) {
          lastError = e.message
        }
      }

      if (!success) {
        await this.markTransactionAsFailed(transactionModel, trx)
        throw new Error(`Payment processing failed: ${lastError}`)
      }

      return transactionModel
    })

    return transaction
  }

  /**
   * Calculates the total amount for a list of products.
   */
  public async calculateTotal(items: { id: number; quantity: number }[]): Promise<number> {
    const products = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findOrFail(item.id)
        return product.amount * item.quantity
      })
    )
    return products.reduce((acc, current) => acc + current, 0)
  }

  /**
   * Refunds a paid transaction using the gateway that processed it.
   */
  public async refund(transactionId: number) {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('gateway')
      .firstOrFail()

    if (transaction.status !== 'PAID') {
      throw new Error('Only paid transactions can be refunded')
    }

    const instance = this.gatewayInstances[transaction.gateway?.name || '']
    if (!instance || !transaction.gateway) {
      throw new Error('Gateway implementation not found for refund')
    }

    return await db.transaction(async (trx) => {
      transaction.useTransaction(trx)
      const result = await instance.refund(transaction.externalId!)

      if (result.success) {
        transaction.status = 'REFUNDED'
        await transaction.save()
        return true
      }

      throw new Error(`Refund failed: ${result.error}`)
    })
  }

  private async getOrCreateClient(customer: { name: string; email: string }, trx?: any) {
    return await Client.firstOrCreate(
      { email: customer.email },
      { name: customer.name },
      { client: trx }
    )
  }

  private async getActiveGatewaysSortedByPriority() {
    return await Gateway.query().where('isActive', true).orderBy('priority', 'asc')
  }

  private async createPendingTransaction(
    clientId: number,
    amount: number,
    cardNumber: string,
    trx?: any
  ) {
    const transaction = new Transaction()
    transaction.fill({
      clientId,
      amount,
      status: 'PENDING',
      cardLastNumbers: cardNumber.slice(-4),
    })
    if (trx) transaction.useTransaction(trx)
    await transaction.save()
    return transaction
  }

  private async attachProductsToTransaction(
    transaction: Transaction,
    products: { id: number; quantity: number }[],
    trx?: any
  ) {
    if (trx) transaction.useTransaction(trx)
    for (const p of products) {
      await transaction.related('products').attach({ [p.id]: { quantity: p.quantity } })
    }
  }

  private buildPaymentRequest(
    client: Client,
    payment: { cardNumber: string; cvv: string },
    amount: number
  ): PaymentRequest {
    return {
      amount,
      name: client.name,
      email: client.email,
      cardNumber: payment.cardNumber,
      cvv: payment.cvv,
    }
  }

  private async finalizeTransaction(
    transaction: Transaction,
    gatewayId: number,
    externalId: string,
    trx?: any
  ) {
    if (trx) transaction.useTransaction(trx)
    transaction.merge({
      status: 'PAID',
      gatewayId,
      externalId,
    })
    await transaction.save()
  }

  private async markTransactionAsFailed(transaction: Transaction, trx?: any) {
    if (trx) transaction.useTransaction(trx)
    transaction.status = 'FAILED'
    await transaction.save()
  }
}
