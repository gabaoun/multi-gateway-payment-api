import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import Client from '#models/client'
import { GatewayOne } from './gateways/gateway_one.js'
import { GatewayTwo } from './gateways/gateway_two.js'
import { type PaymentGateway, type PaymentRequest } from './gateways/payment_gateway.js'

export class PaymentService {
  private gateways: Record<string, PaymentGateway> = {
    'Gateway 1': new GatewayOne(),
    'Gateway 2': new GatewayTwo(),
  }

  public async processPayment(
    customer: { name: string; email: string },
    payment: { cardNumber: string; cvv: string; products: { id: number; quantity: number }[] },
    amount: number
  ) {
    const client = await Client.firstOrCreate({ email: customer.email }, { name: customer.name })

    const providers = await Gateway.query().where('isActive', true).orderBy('priority', 'asc')

    if (!providers.length) {
      throw new Error('Nenhum gateway de pagamento configurado ou ativo')
    }

    const transaction = await Transaction.create({
      clientId: client.id,
      amount,
      status: 'PENDING',
      cardLastNumbers: payment.cardNumber.slice(-4),
    })

    for (const p of payment.products) {
      await transaction.related('products').attach({ [p.id]: { quantity: p.quantity } })
    }

    const request: PaymentRequest = {
      amount,
      name: client.name,
      email: client.email,
      cardNumber: payment.cardNumber,
      cvv: payment.cvv,
    }

    let success = false
    let errorLog = ''

    for (const model of providers) {
      const instance = this.gateways[model.name]
      if (!instance) continue

      const res = await instance.pay(request)

      if (res.success) {
        transaction.merge({
          status: 'PAID',
          gatewayId: model.id,
          externalId: res.externalId,
        })
        await transaction.save()
        success = true
        break
      }

      errorLog = res.error || 'Erro desconhecido'
    }

    if (!success) {
      transaction.status = 'FAILED'
      await transaction.save()
      throw new Error(`Falha no processamento: ${errorLog}`)
    }

    return transaction
  }

  public async refund(id: number) {
    const transaction = await Transaction.query().where('id', id).preload('gateway').firstOrFail()

    if (transaction.status !== 'PAID') {
      throw new Error('Apenas transações pagas podem ser reembolsadas')
    }

    const instance = this.gateways[transaction.gateway?.name || '']
    if (!instance) {
      throw new Error('Implementação do gateway não encontrada para estorno')
    }

    const res = await instance.refund(transaction.externalId!)

    if (res.success) {
      transaction.status = 'REFUNDED'
      await transaction.save()
      return true
    }

    throw new Error(`Falha no estorno: ${res.error}`)
  }
}
