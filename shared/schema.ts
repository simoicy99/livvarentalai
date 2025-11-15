import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// session storage table for replit auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// users table with replit auth fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { enum: ["landlord", "tenant", "both"] }).notNull().default("tenant"),
  phone: varchar("phone"),
  bio: text("bio"),
  verified: boolean("verified").default(false).notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  messages: many(messages),
  trustScores: many(trustScores),
}));

// listings table
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  landlordId: varchar("landlord_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  propertyType: varchar("property_type", { enum: ["apartment", "house", "condo", "room"] }).notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state"),
  country: varchar("country").notNull().default("US"),
  zipCode: varchar("zip_code"),
  price: real("price").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: real("bathrooms").notNull(),
  squareFeet: integer("square_feet"),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`).notNull(),
  images: text("images").array().default(sql`ARRAY[]::text[]`).notNull(),
  available: boolean("available").default(true).notNull(),
  availableFrom: timestamp("available_from"),
  agentActive: boolean("agent_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const listingsRelations = relations(listings, ({ one, many }) => ({
  landlord: one(users, {
    fields: [listings.landlordId],
    references: [users.id],
  }),
  matches: many(matches),
}));

// matches table for ai matchmaking
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchScore: real("match_score").notNull(),
  status: varchar("status", { enum: ["pending", "accepted", "rejected", "expired"] }).notNull().default("pending"),
  aiReasoning: text("ai_reasoning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const matchesRelations = relations(matches, ({ one }) => ({
  listing: one(listings, {
    fields: [matches.listingId],
    references: [listings.id],
  }),
  tenant: one(users, {
    fields: [matches.tenantId],
    references: [users.id],
  }),
}));

// messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  aiGenerated: boolean("ai_generated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  listing: one(listings, {
    fields: [messages.listingId],
    references: [listings.id],
  }),
}));

// trust scores table
export const trustScores = pgTable("trustScores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: real("score").notNull().default(0),
  idVerified: boolean("id_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  rentalHistory: integer("rental_history").default(0).notNull(),
  positiveReviews: integer("positive_reviews").default(0).notNull(),
  negativeReviews: integer("negative_reviews").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trustScoresRelations = relations(trustScores, ({ one }) => ({
  user: one(users, {
    fields: [trustScores.userId],
    references: [users.id],
  }),
}));

// tenant preferences for matching
export const tenantPreferences = pgTable("tenantPreferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  maxPrice: real("max_price"),
  minBedrooms: integer("min_bedrooms"),
  minBathrooms: real("min_bathrooms"),
  preferredCities: text("preferred_cities").array().default(sql`ARRAY[]::text[]`).notNull(),
  propertyTypes: text("property_types").array().default(sql`ARRAY[]::text[]`).notNull(),
  requiredAmenities: text("required_amenities").array().default(sql`ARRAY[]::text[]`).notNull(),
  moveInDate: timestamp("move_in_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantPreferencesRelations = relations(tenantPreferences, ({ one }) => ({
  user: one(users, {
    fields: [tenantPreferences.userId],
    references: [users.id],
  }),
}));

// agent activity log
export const agentActivities = pgTable("agentActivities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { 
    enum: ["listing_posted", "match_created", "message_sent", "inquiry_responded", "listing_updated"] 
  }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentActivitiesRelations = relations(agentActivities, ({ one }) => ({
  user: one(users, {
    fields: [agentActivities.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [agentActivities.listingId],
    references: [listings.id],
  }),
}));

// type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type TrustScore = typeof trustScores.$inferSelect;
export type InsertTrustScore = z.infer<typeof insertTrustScoreSchema>;

export type TenantPreferences = typeof tenantPreferences.$inferSelect;
export type InsertTenantPreferences = z.infer<typeof insertTenantPreferencesSchema>;

export type AgentActivity = typeof agentActivities.$inferSelect;
export type InsertAgentActivity = z.infer<typeof insertAgentActivitySchema>;

// zod schemas for validation
export const insertListingSchema = createInsertSchema(listings, {
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages, {
  content: z.string().min(1, "Message cannot be empty"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertTrustScoreSchema = createInsertSchema(trustScores).omit({
  id: true,
  updatedAt: true,
});

export const insertTenantPreferencesSchema = createInsertSchema(tenantPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentActivitySchema = createInsertSchema(agentActivities).omit({
  id: true,
  createdAt: true,
});
