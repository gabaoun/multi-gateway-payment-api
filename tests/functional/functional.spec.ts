import { test } from '@japa/runner'
import User from '#models/user'
import Product from '#models/product'
import Gateway from '#models/gateway'
import Client from '#models/client'
import Transaction from '#models/transaction'

test.group('Auth', () => {
  test('login with valid credentials', async ({ client }) => {
    const user = await User.firstOrCreate(
      { email: 'test@betalent.tech' },
      { password: 'password', role: 'ADMIN' }
    )
    const response = await client.post('/login').json({
      email: user.email,
      password: 'password',
    })

    response.assertStatus(200)
    response.assertBodyContains({ token: { type: 'bearer' } })
  })
})

test.group('Purchase', (group) => {
  let p1: Product
  let p2: Product

  group.setup(async () => {
    p1 = await Product.firstOrCreate({ name: 'Test Product 1' }, { amount: 1000 })
    p2 = await Product.firstOrCreate({ name: 'Test Product 2' }, { amount: 2000 })

    await Gateway.firstOrCreate({ name: 'Gateway 1' }, { isActive: true, priority: 1 })
    await Gateway.firstOrCreate({ name: 'Gateway 2' }, { isActive: true, priority: 2 })
  })

  test('create a purchase successfully', async ({ client }) => {
    const response = await client.post('/purchase').json({
      client: {
        name: 'Tester',
        email: 'tester@email.com',
      },
      payment: {
        cardNumber: '5569000000006063',
        cvv: '010',
      },
      products: [
        { id: p1.id, quantity: 2 },
        { id: p2.id, quantity: 1 },
      ],
    })

    if (response.status() !== 200) {
      console.log('Erro no Purchase:', response.body())
    }

    response.assertStatus(200)
    response.assertBodyContains({ status: 'PAID', amount: 4000 })
  })

  test('create a purchase successfully with fallback (Gateway 1 fails, Gateway 2 succeeds)', async ({
    client,
  }) => {
    const response = await client.post('/purchase').json({
      client: {
        name: 'Tester Fallback',
        email: 'fallback@email.com',
      },
      payment: {
        cardNumber: '5569000000006063',
        cvv: '100', // CVV 100 força falha no Mock do Gateway 1 e sucesso no Gateway 2
      },
      products: [{ id: p1.id, quantity: 1 }],
    })

    if (response.status() !== 200) {
      console.log('Erro no Fallback Purchase:', response.body())
    }

    response.assertStatus(200)
    response.assertBodyContains({ status: 'PAID', amount: 1000 })
  })

  test('refund a purchase successfully (Finance role)', async ({ client }) => {
    // 1. Criar um usuário Finance e uma Transação Paga
    const user = await User.firstOrCreate(
      { email: 'finance@betalent.tech' },
      { password: 'password', role: 'FINANCE' }
    )
    const g1 = await Gateway.query().where('name', 'Gateway 1').firstOrFail()
    const c1 = await Client.firstOrCreate({ email: 'tester@email.com' }, { name: 'Tester' })

    const transaction = await Transaction.create({
      clientId: c1.id,
      gatewayId: g1.id,
      amount: 1000,
      status: 'PAID',
      externalId: 'ext_test_123',
    })

    const response = await client.post(`/transactions/${transaction.id}/charge_back`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Refund successful' })
  })
})

test.group('RBAC', () => {
  test('user cannot delete product', async ({ client }) => {
    const user = await User.firstOrCreate(
      { email: 'user@test.tech' },
      { password: 'password', role: 'USER' }
    )
    const product = await Product.firstOrCreate({ name: 'Secret Product' }, { amount: 9999 })

    const response = await client.delete(`/products/${product.id}`).loginAs(user)

    response.assertStatus(403)
  })

  test('admin can delete product', async ({ client }) => {
    const user = await User.firstOrCreate(
      { email: 'admin@test.tech' },
      { password: 'password', role: 'ADMIN' }
    )
    const product = await Product.firstOrCreate({ name: 'Old Product' }, { amount: 10 })

    const response = await client.delete(`/products/${product.id}`).loginAs(user)

    response.assertStatus(204)
  })
})
