import { type HttpContext } from '@adonisjs/core/http'
import { type NextFn } from '@adonisjs/core/types/http'
import type User from '#models/user'

export default class RoleMiddleware {
  public async handle(ctx: HttpContext, next: NextFn, roles: string[]) {
    const user = ctx.auth.user as User

    if (!user) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }

    if (!roles.includes(user.role)) {
      return ctx.response.forbidden({ error: 'Access denied' })
    }

    return await next()
  }
}
