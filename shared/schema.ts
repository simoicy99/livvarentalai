import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  imageUrl: text("image_url").notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  sqft: integer("sqft"),
  availableFrom: timestamp("available_from"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listings).omit({ id: true, createdAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export const depositSessions = pgTable("deposit_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  listingId: integer("listing_id").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(),
  landlordId: varchar("landlord_id", { length: 255 }).notNull(),
  checkoutUrl: text("checkout_url").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDepositSessionSchema = createInsertSchema(depositSessions).omit({ id: true, createdAt: true });
export type InsertDepositSession = z.infer<typeof insertDepositSessionSchema>;
export type DepositSession = typeof depositSessions.$inferSelect;

export type FeedResponse = {
  items: Listing[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type CreateDepositParams = {
  listingId: string;
  amount: number;
  currency: string;
  tenantId: string;
  landlordId: string;
};

export type CreateDepositResponse = {
  sessionId: string;
  checkoutUrl: string;
  expiresAt: string;
};
