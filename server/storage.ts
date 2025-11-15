import {
  users,
  listings,
  messages,
  matches,
  trustScores,
  tenantPreferences,
  agentActivities,
  payments,
  type User,
  type UpsertUser,
  type Listing,
  type InsertListing,
  type Message,
  type InsertMessage,
  type Match,
  type InsertMatch,
  type TrustScore,
  type InsertTrustScore,
  type TenantPreferences,
  type InsertTenantPreferences,
  type AgentActivity,
  type InsertAgentActivity,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  
  createListing(listing: InsertListing): Promise<Listing>;
  getListings(landlordId?: string): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
  updateListing(id: string, data: Partial<InsertListing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
  searchListings(query: string): Promise<Listing[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;
  
  createMatch(match: InsertMatch): Promise<Match>;
  getMatches(userId: string, userType: "tenant" | "landlord"): Promise<Match[]>;
  updateMatchStatus(id: string, status: Match["status"]): Promise<Match>;
  
  getTrustScore(userId: string): Promise<TrustScore | undefined>;
  upsertTrustScore(score: InsertTrustScore): Promise<TrustScore>;
  
  getTenantPreferences(userId: string): Promise<TenantPreferences | undefined>;
  upsertTenantPreferences(prefs: InsertTenantPreferences): Promise<TenantPreferences>;
  
  createAgentActivity(activity: InsertAgentActivity): Promise<AgentActivity>;
  getAgentActivities(userId?: string, limit?: number): Promise<AgentActivity[]>;
  
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayments(userId?: string, listingId?: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByStripeIntentId(stripePaymentIntentId: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: Payment["status"]): Promise<Payment>;
  
  getDashboardStats(userId: string, userType: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [created] = await db.insert(listings).values(listing).returning();
    return created;
  }

  async getListings(landlordId?: string): Promise<Listing[]> {
    if (landlordId) {
      return await db
        .select()
        .from(listings)
        .where(eq(listings.landlordId, landlordId))
        .orderBy(desc(listings.createdAt));
    }
    return await db.select().from(listings).orderBy(desc(listings.createdAt));
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async updateListing(id: string, data: Partial<InsertListing>): Promise<Listing> {
    const [listing] = await db
      .update(listings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return listing;
  }

  async deleteListing(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  async searchListings(query: string): Promise<Listing[]> {
    if (!query) {
      return await db
        .select()
        .from(listings)
        .where(eq(listings.available, true))
        .orderBy(desc(listings.createdAt))
        .limit(50);
    }

    return await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.available, true),
          or(
            sql`${listings.title} ILIKE ${'%' + query + '%'}`,
            sql`${listings.city} ILIKE ${'%' + query + '%'}`,
            sql`${listings.description} ILIKE ${'%' + query + '%'}`
          )
        )
      )
      .orderBy(desc(listings.createdAt))
      .limit(50);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getConversations(userId: string): Promise<any[]> {
    const result = await db.execute(sql`
      WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id 
            ELSE sender_id 
          END
        )
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id 
            ELSE sender_id 
          END as other_user_id,
          content,
          created_at,
          read,
          sender_id = ${userId} as is_sent
        FROM messages
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
        ORDER BY 
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id 
            ELSE sender_id 
          END,
          created_at DESC
      )
      SELECT 
        u.id as user_id,
        u.first_name || ' ' || COALESCE(u.last_name, '') as user_name,
        u.profile_image_url as user_image,
        lm.content as last_message,
        lm.created_at as timestamp,
        NOT lm.read AND NOT lm.is_sent as unread
      FROM latest_messages lm
      JOIN users u ON u.id = lm.other_user_id
      ORDER BY lm.created_at DESC
    `);
    return result.rows as any[];
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(and(eq(messages.receiverId, userId), eq(messages.senderId, senderId)));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [created] = await db.insert(matches).values(match).returning();
    return created;
  }

  async getMatches(userId: string, userType: "tenant" | "landlord"): Promise<Match[]> {
    if (userType === "tenant") {
      return await db
        .select()
        .from(matches)
        .where(eq(matches.tenantId, userId))
        .orderBy(desc(matches.matchScore));
    } else {
      const landlordListings = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.landlordId, userId));
      
      if (landlordListings.length === 0) return [];

      return await db
        .select()
        .from(matches)
        .where(
          sql`${matches.listingId} IN (${sql.join(landlordListings.map(l => sql`${l.id}`), sql`, `)})`
        )
        .orderBy(desc(matches.matchScore));
    }
  }

  async updateMatchStatus(id: string, status: Match["status"]): Promise<Match> {
    const [match] = await db
      .update(matches)
      .set({ status, updatedAt: new Date() })
      .where(eq(matches.id, id))
      .returning();
    return match;
  }

  async getTrustScore(userId: string): Promise<TrustScore | undefined> {
    const [score] = await db.select().from(trustScores).where(eq(trustScores.userId, userId));
    return score;
  }

  async upsertTrustScore(scoreData: InsertTrustScore): Promise<TrustScore> {
    const [score] = await db
      .insert(trustScores)
      .values(scoreData)
      .onConflictDoUpdate({
        target: trustScores.userId,
        set: {
          ...scoreData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return score;
  }

  async getTenantPreferences(userId: string): Promise<TenantPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(tenantPreferences)
      .where(eq(tenantPreferences.userId, userId));
    return prefs;
  }

  async upsertTenantPreferences(prefsData: InsertTenantPreferences): Promise<TenantPreferences> {
    const [prefs] = await db
      .insert(tenantPreferences)
      .values(prefsData)
      .onConflictDoUpdate({
        target: tenantPreferences.userId,
        set: {
          ...prefsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return prefs;
  }

  async createAgentActivity(activity: InsertAgentActivity): Promise<AgentActivity> {
    const [created] = await db.insert(agentActivities).values(activity).returning();
    return created;
  }

  async getAgentActivities(userId?: string, limit: number = 10): Promise<AgentActivity[]> {
    if (userId) {
      return await db
        .select()
        .from(agentActivities)
        .where(eq(agentActivities.userId, userId))
        .orderBy(desc(agentActivities.createdAt))
        .limit(limit);
    }
    return await db
      .select()
      .from(agentActivities)
      .orderBy(desc(agentActivities.createdAt))
      .limit(limit);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async getPayments(userId?: string, listingId?: string): Promise<Payment[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(payments.userId, userId));
    }
    if (listingId) {
      conditions.push(eq(payments.listingId, listingId));
    }

    if (conditions.length === 0) {
      return await db.select().from(payments).orderBy(desc(payments.createdAt));
    }

    return await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByStripeIntentId(stripePaymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
    return payment;
  }

  async updatePaymentStatus(id: string, status: Payment["status"]): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ status, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getDashboardStats(userId: string, userType: string): Promise<any> {
    const isLandlord = userType === "landlord" || userType === "both";
    const isTenant = userType === "tenant" || userType === "both";

    if (isLandlord) {
      const [listingsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(eq(listings.landlordId, userId));

      const [activeListings] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(eq(listings.landlordId, userId), eq(listings.available, true)));

      const landlordListings = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.landlordId, userId));

      let matchesCount = 0;
      if (landlordListings.length > 0) {
        const [matchesResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(matches)
          .where(
            sql`${matches.listingId} IN (${sql.join(landlordListings.map(l => sql`${l.id}`), sql`, `)})`
          );
        matchesCount = matchesResult?.count || 0;
      }

      const [messagesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(eq(messages.receiverId, userId), eq(messages.read, false)));

      return {
        listingsCount: listingsCount?.count || 0,
        activeListings: activeListings?.count || 0,
        matchesCount,
        messagesCount: messagesCount?.count || 0,
      };
    } else {
      const [matchesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(matches)
        .where(eq(matches.tenantId, userId));

      const [messagesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(eq(messages.receiverId, userId), eq(messages.read, false)));

      return {
        matchesCount: matchesCount?.count || 0,
        messagesCount: messagesCount?.count || 0,
        listingsCount: 0,
        activeListings: 0,
      };
    }
  }
}

export const storage = new DatabaseStorage();
