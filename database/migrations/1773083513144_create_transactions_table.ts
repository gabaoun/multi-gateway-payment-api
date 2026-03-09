import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('client').unsigned().references('id').inTable('clients').onDelete('CASCADE')
      table
        .integer('gateway')
        .unsigned()
        .references('id')
        .inTable('gateways')
        .onDelete('SET NULL')
        .nullable()
      table.string('external_id').nullable() // ID from the gateway
      table
        .enum('status', ['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
        .notNullable()
        .defaultTo('PENDING')
      table.integer('amount').notNullable() // total value in cents
      table.string('card_last_numbers', 4).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
