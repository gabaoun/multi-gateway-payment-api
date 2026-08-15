import jwt from 'jsonwebtoken'
import env from '#start/env'

/**
 * Stateless JWT layer for server-to-server (merchant) integrations,
 * distinct from the opaque DB-backed access tokens issued at /login for
 * staff (@adonisjs/auth's tokensGuard). Merchants authenticate via an
 * OAuth2 client-credentials-style exchange (client_id/client_secret ->
 * scoped JWT) instead of a user session, since they have no User record.
 */

export interface MerchantTokenPayload {
  sub: string
  scopes: string[]
}

const ISSUER = 'multi-gateway-payment-api'
const DEFAULT_TTL_SECONDS = 3600

export class JwtService {
  static sign(payload: MerchantTokenPayload, expiresInSeconds = DEFAULT_TTL_SECONDS): string {
    return jwt.sign(payload, env.get('JWT_SECRET').release(), {
      issuer: ISSUER,
      expiresIn: expiresInSeconds,
    })
  }

  /**
   * Throws jwt.JsonWebTokenError / jwt.TokenExpiredError on an invalid or
   * expired token - callers are expected to catch and translate to a 401.
   */
  static verify(token: string): MerchantTokenPayload {
    const decoded = jwt.verify(token, env.get('JWT_SECRET').release(), { issuer: ISSUER })
    return decoded as unknown as MerchantTokenPayload
  }
}
