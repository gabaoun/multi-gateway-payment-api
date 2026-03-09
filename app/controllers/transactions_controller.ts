import { type HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import Product from '#models/product'
import { PaymentService } from '#services/payment_service'
import vine from '@vinejs/vine'

export default class TransactionsController {
  private paymentService = new PaymentService()

  public async purchase({ request, response }: HttpContext) {
    const schema = vine.compile(
      vine.object({
        client: vine.object({
          name: vine.string(),
          email: vine.string().email(),
        }),
        payment: vine.object({
          cardNumber: vine.string().minLength(16).maxLength(16),
          cvv: vine.string().minLength(3).maxLength(4),
        }),
        products: vine
          .array(
            vine.object({
              id: vine.number(),
              quantity: vine.number().positive(),
            })
          )
          .minLength(1),
      })
    )

    const payload = await request.validateUsing(schema)

    const items = await Promise.all(
      payload.products.map(async (p) => {
        const product = await Product.findOrFail(p.id)
        return { id: product.id, quantity: p.quantity, price: product.amount }
      })
    )

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    try {
      const transaction = await this.paymentService.processPayment(
        payload.client,
        { ...payload.payment, products: items },
        total
      )

      return response.ok(transaction)
    } catch (e) {
      return response.badRequest({ message: e.message })
    }
  }

  public async index({ response }: HttpContext) {
    const transactions = await Transaction.query()
      .preload('client')
      .preload('gateway')
      .preload('products')
    return response.ok(transactions)
  }

  public async show({ params, response }: HttpContext) {
    const transaction = await Transaction.query()
      .where('id', params.id)
      .preload('client')
      .preload('gateway')
      .preload('products')
      .firstOrFail()
    return response.ok(transaction)
  }

  public async refund({ params, response }: HttpContext) {
    try {
      await this.paymentService.refund(params.id)
      return response.ok({ message: 'Refund successful' })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
