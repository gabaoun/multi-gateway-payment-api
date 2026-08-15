import { test } from '@japa/runner'
import jwt from 'jsonwebtoken'
import { JwtService } from '#services/jwt_service'

test.group('JwtService', () => {
  test('signs and verifies a round-trip token, preserving claims', ({ assert }) => {
    const token = JwtService.sign({ sub: 'demo-merchant', scopes: ['merchant:read'] })
    const decoded = JwtService.verify(token)

    assert.equal(decoded.sub, 'demo-merchant')
    assert.deepEqual(decoded.scopes, ['merchant:read'])
  })

  test('rejects a token signed with a different secret', ({ assert }) => {
    const foreignToken = jwt.sign({ sub: 'attacker', scopes: ['merchant:read'] }, 'wrong-secret', {
      issuer: 'multi-gateway-payment-api',
    })

    assert.throws(() => JwtService.verify(foreignToken))
  })

  test('rejects an expired token', ({ assert }) => {
    const expiredToken = JwtService.sign({ sub: 'demo-merchant', scopes: ['merchant:read'] }, -1)

    assert.throws(() => JwtService.verify(expiredToken), jwt.TokenExpiredError)
  })

  test('rejects a token with a mismatched issuer', ({ assert }) => {
    const token = jwt.sign(
      { sub: 'demo-merchant', scopes: ['merchant:read'] },
      'local-dev-secret-not-for-production',
      { issuer: 'someone-elses-service' }
    )

    assert.throws(() => JwtService.verify(token))
  })
})
