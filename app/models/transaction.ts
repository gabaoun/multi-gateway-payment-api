import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Client from '#models/client'
import Gateway from '#models/gateway'
import Product from '#models/product'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'client' })
  declare clientId: number

  @column({ columnName: 'gateway' })
  declare gatewayId: number | null

  @column({ columnName: 'external_id' })
  declare externalId: string | null

  @column()
  declare status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

  @column()
  declare amount: number

  @column({ columnName: 'card_last_numbers' })
  declare cardLastNumbers: string | null

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Gateway)
  declare gateway: BelongsTo<typeof Gateway>

  @manyToMany(() => Product, {
    pivotTable: 'transaction_products',
    localKey: 'id',
    pivotForeignKey: 'transaction_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'product_id',
    pivotColumns: ['quantity'],
    pivotTimestamps: true,
  })
  declare products: ManyToMany<typeof Product>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
