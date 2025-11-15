import { pgTable, serial, text, integer, timestamp, varchar, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: text("profile_image_url"),
  userType: varchar("user_type", { length: 50 }).default("tenant"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  landlordId: varchar("landlord_id", { length: 255 }),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  listingId: integer("listing_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(),
  listingId: integer("listing_id").notNull(),
  landlordId: varchar("landlord_id", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export const trustScores = pgTable("trust_scores", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  score: integer("score").default(0).notNull(),
  verifiedId: boolean("verified_id").default(false).notNull(),
  verifiedPhone: boolean("verified_phone").default(false).notNull(),
  verifiedEmail: boolean("verified_email").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrustScoreSchema = createInsertSchema(trustScores).omit({ id: true, updatedAt: true });
export type InsertTrustScore = z.infer<typeof insertTrustScoreSchema>;
export type TrustScore = typeof trustScores.$inferSelect;

export const tenantPreferences = pgTable("tenant_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  minBudget: integer("min_budget"),
  maxBudget: integer("max_budget"),
  preferredCities: json("preferred_cities").$type<string[]>(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  minSqft: integer("min_sqft"),
  petFriendly: boolean("pet_friendly"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTenantPreferencesSchema = createInsertSchema(tenantPreferences).omit({ id: true, updatedAt: true });
export type InsertTenantPreferences = z.infer<typeof insertTenantPreferencesSchema>;
export type TenantPreferences = typeof tenantPreferences.$inferSelect;

export const agentActivities = pgTable("agent_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  agentType: varchar("agent_type", { length: 100 }).notNull(),
  action: text("action").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentActivitySchema = createInsertSchema(agentActivities).omit({ id: true, createdAt: true });
export type InsertAgentActivity = z.infer<typeof insertAgentActivitySchema>;
export type AgentActivity = typeof agentActivities.$inferSelect;

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  listingId: integer("listing_id"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("usd").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  locusSessionId: varchar("locus_session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  postType: varchar("post_type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  city: varchar("city", { length: 255 }),
  metadata: json("metadata"),
  agentGenerated: boolean("agent_generated").default(false).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;

export const savedListings = pgTable("saved_listings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  listingId: integer("listing_id").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSavedListingSchema = createInsertSchema(savedListings).omit({ id: true, createdAt: true });
export type InsertSavedListing = z.infer<typeof insertSavedListingSchema>;
export type SavedListing = typeof savedListings.$inferSelect;

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
