import { test } from '@japa/runner'
import type { HttpContext } from '@adonisjs/core/http'
import ScopeMiddleware from '#middleware/scope_middleware'

/**
 * Middleware logic is exercised directly against a minimal duck-typed
 * context (cast to HttpContext) rather than the full HttpContextFactory -
 * the factory requires a real Node IncomingMessage/ServerResponse pair,
 * which buys nothing here since this middleware only touches
 * ctx.jwtPayload and ctx.response.{unauthorized,forbidden}.
 */
function fakeContext(jwtPayload?: { sub: string; scopes: string[] }) {
  const calls: { method: string; body: unknown }[] = []
  const ctx = {
    jwtPayload,
    response: {
      unauthorized: (body: unknown) => calls.push({ method: 'unauthorized', body }),
      forbidden: (body: unknown) => calls.push({ method: 'forbidden', body }),
    },
  }
  return { ctx: ctx as unknown as HttpContext, calls }
}

test.group('ScopeMiddleware', () => {
  test('rejects with 401 when no jwtPayload is present', async ({ assert }) => {
    const { ctx, calls } = fakeContext(undefined)
    const middleware = new ScopeMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    }, ['merchant:read'])

    assert.isFalse(nextCalled)
    assert.equal(calls[0]?.method, 'unauthorized')
  })

  test('rejects with 403 when the token is missing a required scope', async ({ assert }) => {
    const { ctx, calls } = fakeContext({ sub: 'demo-merchant', scopes: ['merchant:read'] })
    const middleware = new ScopeMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    }, ['merchant:write'])

    assert.isFalse(nextCalled)
    assert.equal(calls[0]?.method, 'forbidden')
  })

  test('calls next when all required scopes are present', async ({ assert }) => {
    const { ctx, calls } = fakeContext({
      sub: 'demo-merchant',
      scopes: ['merchant:read', 'merchant:write'],
    })
    const middleware = new ScopeMiddleware()
    let nextCalled = false

    await middleware.handle(ctx, async () => {
      nextCalled = true
    }, ['merchant:read'])

    assert.isTrue(nextCalled)
    assert.lengthOf(calls, 0)
  })
})
