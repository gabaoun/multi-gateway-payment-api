import { type HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import vine from '@vinejs/vine'

export default class UsersController {
  public async index({ response }: HttpContext) {
    const users = await User.all()
    return response.ok(users)
  }

  public async store({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        email: vine.string().email().unique({ table: 'users', column: 'email' }),
        password: vine.string().minLength(6),
        role: vine.enum(['ADMIN', 'MANAGER', 'FINANCE', 'USER']),
      })
    )

    const payload = await request.validateUsing(validator)
    const user = await User.create(payload)

    return response.created(user)
  }

  public async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.ok(user)
  }

  public async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

    const validator = vine.compile(
      vine.object({
        email: vine
          .string()
          .email()
          .unique({
            table: 'users',
            column: 'email',
            filter: (db) => {
              db.whereNot('id', user.id)
            },
          })
          .optional(),
        password: vine.string().minLength(6).optional(),
        role: vine.enum(['ADMIN', 'MANAGER', 'FINANCE', 'USER']).optional(),
      })
    )

    const payload = await request.validateUsing(validator)
    user.merge(payload)
    await user.save()

    return response.ok(user)
  }

  public async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }
}
