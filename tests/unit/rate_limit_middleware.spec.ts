import { test } from '@japa/runner'
import type { HttpContext } from '@adonisjs/core/http'
import RateLimitMiddleware, { __resetRateLimitState } from '#middleware/rate_limit_middleware'

function fakeContext(ip: string, pattern: string) {
  const headers: Record<string, string> = {}
  const ctx = {
    request: {
      ip: () => ip,
      url: () => pattern,
    },
    route: { pattern },
    response: {
      header: (key: string, value: string) => {
        headers[key] = value
      },
      tooManyRequests: (body: unknown) => body,
    },
  }
  return { ctx: ctx as unknown as HttpContext, headers }
}

test.group('RateLimitMiddleware', (group) => {
  group.each.setup(() => __resetRateLimitState())

  test('allows requests under the limit', async ({ assert }) => {
    const { ctx } = fakeContext('1.1.1.1', '/merchant/token')
    const middleware = new RateLimitMiddleware()
    let nextCalls = 0

    for (let i = 0; i < 3; i++) {
      await middleware.handle(ctx, async () => {
        nextCalls++
      }, ['5', '60'])
    }

    assert.equal(nextCalls, 3)
  })

  test('blocks once the limit is exceeded, setting Retry-After', async ({ assert }) => {
    const { ctx, headers } = fakeContext('2.2.2.2', '/merchant/token')
    const middleware = new RateLimitMiddleware()
    let nextCalls = 0

    for (let i = 0; i < 5; i++) {
      await middleware.handle(ctx, async () => {
        nextCalls++
      }, ['2', '60'])
    }

    assert.equal(nextCalls, 2)
    assert.property(headers, 'Retry-After')
  })

  test('tracks separate keys independently by IP', async ({ assert }) => {
    const middleware = new RateLimitMiddleware()
    const clientA = fakeContext('3.3.3.1', '/merchant/token')
    const clientB = fakeContext('3.3.3.2', '/merchant/token')
    let callsA = 0
    let callsB = 0

    await middleware.handle(clientA.ctx, async () => callsA++, ['1', '60'])
    await middleware.handle(clientA.ctx, async () => callsA++, ['1', '60']) // blocked
    await middleware.handle(clientB.ctx, async () => callsB++, ['1', '60']) // separate bucket

    assert.equal(callsA, 1)
    assert.equal(callsB, 1)
  })
})
