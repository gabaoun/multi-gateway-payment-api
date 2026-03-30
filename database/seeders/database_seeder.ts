import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Product from '#models/product'
import Gateway from '#models/gateway'

export default class extends BaseSeeder {
  async run() {
    // Create Users
    await User.createMany([
      { email: 'admin@payments.io', password: 'password', role: 'ADMIN' },
      { email: 'manager@payments.io', password: 'password', role: 'MANAGER' },
      { email: 'finance@payments.io', password: 'password', role: 'FINANCE' },
      { email: 'user@payments.io', password: 'password', role: 'USER' },
    ])

    // Create Products
    await Product.createMany([
      { name: 'Product A', amount: 1000 }, // 10.00
      { name: 'Product B', amount: 2000 }, // 20.00
      { name: 'Product C', amount: 5000 }, // 50.00
    ])

    // Create Gateways
    await Gateway.createMany([
      { name: 'Gateway 1', isActive: true, priority: 1 },
      { name: 'Gateway 2', isActive: true, priority: 2 },
    ])
  }
}
