import { type HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import vine from '@vinejs/vine'

export default class GatewaysController {
  public async index({ response }: HttpContext) {
    const gateways = await Gateway.query().orderBy('priority', 'asc')
    return response.ok(gateways)
  }

  public async update({ params, request, response }: HttpContext) {
    const gateway = await Gateway.findOrFail(params.id)

    const validator = vine.compile(
      vine.object({
        isActive: vine.boolean().optional(),
        priority: vine.number().optional(),
      })
    )

    const payload = await request.validateUsing(validator)
    gateway.merge(payload)
    await gateway.save()

    return response.ok(gateway)
  }
}
