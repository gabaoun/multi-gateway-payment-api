import { type HttpContext } from '@adonisjs/core/http'
import { type NextFn } from '@adonisjs/core/types/http'

/**
 * OWASP API Top 10 (API1: Broken Object Level Authorization / API5: Broken
 * Function Level Authorization) mitigation for the merchant JWT surface:
 * requires the token's `scopes` claim to include every scope passed to
 * `.use(middleware.scope([...]))` on the route. Must run after
 * jwt_auth_middleware, which populates ctx.jwtPayload.
 */
export default class ScopeMiddleware {
  public async handle(ctx: HttpContext, next: NextFn, requiredScopes: string[]) {
    const payload = ctx.jwtPayload

    if (!payload) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }

    const hasAllScopes = requiredScopes.every((scope) => payload.scopes.includes(scope))
    if (!hasAllScopes) {
      return ctx.response.forbidden({
        error: 'Insufficient scope',
        required: requiredScopes,
      })
    }

    return await next()
  }
}
