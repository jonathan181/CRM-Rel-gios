import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Auth UID
  name: text('name'),
  email: text('email').notNull(),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const watches = pgTable('watches', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  userUid: text('user_uid').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  ref: text('ref').notNull(),
  serialNumber: text('serial_number'),
  condition: text('condition').notNull(),
  purchaseDate: text('purchase_date').notNull(),
  purchaseCurrency: text('purchase_currency').notNull(),
  purchasePrice: doublePrecision('purchase_price').notNull(),
  freightCost: doublePrecision('freight_cost').notNull(),
  exchangeRate: doublePrecision('exchange_rate').notNull(),
  taxesBrl: doublePrecision('taxes_brl').notNull(),
  totalCostBrl: doublePrecision('total_cost_brl').notNull(),
  supplier: text('supplier').notNull(),
  notesAndSpecs: text('notes_and_specs'),
  images: json('images').$type<string[]>().default([]).notNull(),
  status: text('status').notNull(),
  marketPriceBrl: doublePrecision('market_price_brl'),
  salePriceBrl: doublePrecision('sale_price_brl'),
  salePriceUsd: doublePrecision('sale_price_usd'),
  saleDate: text('sale_date'),
  shippingAndFeesBrl: doublePrecision('shipping_and_fees_brl'),
  buyerName: text('buyer_name'),
  buyerContact: text('buyer_contact'),
  saleNotes: text('sale_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  watches: many(watches),
}));

export const watchesRelations = relations(watches, ({ one }) => ({
  owner: one(users, {
    fields: [watches.userId],
    references: [users.id],
  }),
}));
