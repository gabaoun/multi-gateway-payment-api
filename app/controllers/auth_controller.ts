import { type HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import vine from '@vinejs/vine'

export default class AuthController {
  public async login({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        email: vine.string().email(),
        password: vine.string(),
      })
    )

    const { email, password } = await request.validateUsing(validator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return response.ok({
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  }
}
