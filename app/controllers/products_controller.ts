import { type HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import vine from '@vinejs/vine'

export default class ProductsController {
  public async index({ response }: HttpContext) {
    const products = await Product.all()
    return response.ok(products)
  }

  public async store({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        name: vine.string(),
        amount: vine.number().positive(),
      })
    )

    const payload = await request.validateUsing(validator)
    const product = await Product.create(payload)

    return response.created(product)
  }

  public async show({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    return response.ok(product)
  }

  public async update({ params, request, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)

    const validator = vine.compile(
      vine.object({
        name: vine.string().optional(),
        amount: vine.number().positive().optional(),
      })
    )

    const payload = await request.validateUsing(validator)
    product.merge(payload)
    await product.save()

    return response.ok(product)
  }

  public async destroy({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.delete()
    return response.noContent()
  }
}
