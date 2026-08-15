import { type HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import env from '#start/env'
import { JwtService } from '#services/jwt_service'

/**
 * OAuth2 client-credentials-grant-style exchange for merchant/server-to-server
 * integrations. Distinct from /login (which is for staff users backed by the
 * User model + session/opaque-token guard) - merchants have no user record,
 * just a client_id/client_secret pair, matching how external API consumers
 * are typically provisioned (env/secret-store, not a users table row).
 */
export default class MerchantAuthController {
  public async token({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        client_id: vine.string(),
        client_secret: vine.string(),
        grant_type: vine.literal('client_credentials'),
      })
    )

    const { client_id: clientId, client_secret: clientSecret } =
      await request.validateUsing(validator)

    const expectedId = env.get('MERCHANT_CLIENT_ID')
    const expectedSecret = env.get('MERCHANT_CLIENT_SECRET').release()

    if (clientId !== expectedId || clientSecret !== expectedSecret) {
      return response.unauthorized({ error: 'invalid_client' })
    }

    const accessToken = JwtService.sign({
      sub: clientId,
      scopes: ['merchant:read'],
    })

    return response.ok({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'merchant:read',
    })
  }
}
