import { type HttpContext } from '@adonisjs/core/http'
import { type NextFn } from '@adonisjs/core/types/http'

/**
 * OWASP API Top 10 (API4: Unrestricted Resource Consumption) mitigation.
 * In-memory fixed-window limiter keyed by client IP + route pattern -
 * intentionally simple, matching this repo's "resilience study, not a
 * production deployment" scope (README). A multi-instance deployment would
 * need a shared store (Redis) instead of this process-local Map.
 *
 * Usage: .use(middleware.rateLimit(['20', '60'])) -> 20 requests / 60s window.
 */
const hits = new Map<string, { count: number; resetAt: number }>()

export default class RateLimitMiddleware {
  public async handle(ctx: HttpContext, next: NextFn, args: string[] = ['20', '60']) {
    const [maxRequestsRaw, windowSecondsRaw] = args
    const maxRequests = Number(maxRequestsRaw ?? 20)
    const windowSeconds = Number(windowSecondsRaw ?? 60)

    const key = `${ctx.request.ip()}:${ctx.route?.pattern ?? ctx.request.url()}`
    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
      return await next()
    }

    if (entry.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
      ctx.response.header('Retry-After', String(retryAfterSeconds))
      return ctx.response.tooManyRequests({
        error: 'Rate limit exceeded',
        retryAfterSeconds,
      })
    }

    entry.count += 1
    return await next()
  }
}

/** Test-only hook: clears in-memory rate-limit state between test cases. */
export function __resetRateLimitState() {
  hits.clear()
}
