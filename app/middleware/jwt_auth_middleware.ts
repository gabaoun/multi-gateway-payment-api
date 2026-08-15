import { type HttpContext } from '@adonisjs/core/http'
import { type NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'
import { JwtService, type MerchantTokenPayload } from '#services/jwt_service'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    jwtPayload?: MerchantTokenPayload
  }
}

/**
 * Verifies a merchant-scoped Bearer JWT (distinct from the session/opaque
 * token guard used by staff routes). Populates ctx.jwtPayload for the
 * scope_middleware to authorize against.
 */
export default class JwtAuthMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    const header = ctx.request.header('authorization')
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

    if (!token) {
      return ctx.response.unauthorized({ error: 'Missing bearer token' })
    }

    try {
      ctx.jwtPayload = JwtService.verify(token)
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return ctx.response.unauthorized({ error: 'Token expired' })
      }
      return ctx.response.unauthorized({ error: 'Invalid token' })
    }

    return await next()
  }
}
