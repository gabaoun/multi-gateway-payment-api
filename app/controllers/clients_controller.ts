import { type HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'

export default class ClientsController {
  public async index({ response }: HttpContext) {
    const clients = await Client.all()
    return response.ok(clients)
  }

  public async show({ params, response }: HttpContext) {
    const client = await Client.query().where('id', params.id).preload('transactions').firstOrFail()
    return response.ok(client)
  }
}
