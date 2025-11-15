import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import * as schema from "../shared/schema";
import { getFeedPage } from "./lib/agent/agentService";
import { createDepositSession } from "./lib/integrations/locus";
import { matchListingsToTenant } from "./lib/agent/matchAgent";
import { generateInitialMessage, generateFollowUpMessage } from "./lib/agent/communicationAgent";
import { createDeposit, checkDepositStatus, releaseDeposit } from "./lib/agent/paymentsAgent";
import { listEscrowsForTenant } from "./lib/services/escrowService";
import { createLocusMCPPayment, checkLocusMCPPaymentStatus } from "./lib/agent/locusMCPAgent";
import type { CreateDepositParams, TenantProfile } from "../shared/types";

export function registerRoutes(app: Express): Server {
  app.get("/api/listing/:id", async (req, res) => {
    try {
      const listingId = req.params.id;
      
      const feedResult = await getFeedPage(1, 100, {});
      const listing = feedResult.items.find(l => l.id === listingId);
      
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      res.json(listing);
    } catch (error: any) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  app.get("/api/feed", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.max(1, Math.min(50, parseInt(req.query.pageSize as string) || 20));
      const cityFilter = req.query.city as string | undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const searchQuery = req.query.q as string | undefined;

      const listingsResult = await getFeedPage(page, pageSize, {
        cityFilter,
        maxPrice,
        searchQuery,
      });

      const communityPosts = await db
        .select()
        .from(schema.communityPosts)
        .orderBy(schema.communityPosts.createdAt)
        .limit(3);

      const mixedItems = [
        ...listingsResult.items.map((item: any) => ({ ...item, type: 'listing' })),
        ...communityPosts.map((post: any) => ({ ...post, type: 'post' }))
      ].sort((a: any, b: any) => {
        const dateA = 'createdAt' in a ? new Date(a.createdAt as string).getTime() : Date.now();
        const dateB = 'createdAt' in b ? new Date(b.createdAt as string).getTime() : Date.now();
        return dateB - dateA;
      });

      res.json({
        items: mixedItems,
        page: listingsResult.page,
        pageSize: listingsResult.pageSize,
        hasMore: listingsResult.hasMore,
      });
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ error: "Failed to fetch feed" });
    }
  });

  // get matches for user
  app.get("/api/matches/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      res.json([]);
    } catch (error: any) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  // match agent endpoint - scores and ranks listings for a tenant
  app.post("/api/match", async (req, res) => {
    try {
      const { tenantProfile } = req.body as { tenantProfile: TenantProfile };

      if (!tenantProfile) {
        return res.status(400).json({ error: "Missing tenantProfile" });
      }

      // get all listings
      const feedResult = await getFeedPage(1, 100, {});
      
      // match listings to tenant
      const matches = matchListingsToTenant(tenantProfile, feedResult.items);

      res.json({ matches });
    } catch (error: any) {
      console.error("Error matching listings:", error);
      res.status(500).json({ error: "Failed to match listings" });
    }
  });

  // communication agent endpoint - generates messages for tenants
  app.post("/api/messages", async (req, res) => {
    try {
      const { type, tenant, listingId, context } = req.body as {
        type: "initial" | "followUp";
        tenant: TenantProfile;
        listingId: string;
        context?: string;
      };

      if (!tenant || !listingId) {
        return res.status(400).json({ error: "Missing tenant or listingId" });
      }

      // get the listing
      const feedResult = await getFeedPage(1, 100, {});
      const listing = feedResult.items.find(l => l.id === listingId);

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      // generate message
      const message = type === "initial"
        ? generateInitialMessage(tenant, listing)
        : generateFollowUpMessage(tenant, listing, context);

      res.json({ message });
    } catch (error: any) {
      console.error("Error generating message:", error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });

  // escrow endpoints using payments agent
  app.post("/api/escrow/create", async (req, res) => {
    try {
      const { listingId, tenantEmail, amount, currency, channelPreference } = req.body;

      if (!listingId || !tenantEmail || !amount) {
        return res.status(400).json({ 
          error: "Missing required fields: listingId, tenantEmail, amount" 
        });
      }

      const result = await createDeposit({
        listingId,
        tenantEmail,
        amount,
        currency,
        channelPreference,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error creating escrow:", error);
      res.status(500).json({ error: error.message || "Failed to create escrow" });
    }
  });

  app.get("/api/escrow/status", async (req, res) => {
    try {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing escrow id" });
      }

      const escrow = await checkDepositStatus(id);

      if (!escrow) {
        return res.status(404).json({ error: "Escrow not found" });
      }

      res.json({ escrow });
    } catch (error: any) {
      console.error("Error checking escrow status:", error);
      res.status(500).json({ error: "Failed to check escrow status" });
    }
  });

  app.post("/api/escrow/release", async (req, res) => {
    try {
      const { escrowId } = req.body;

      if (!escrowId) {
        return res.status(400).json({ error: "Missing escrowId" });
      }

      const escrow = await releaseDeposit(escrowId);

      if (!escrow) {
        return res.status(404).json({ error: "Escrow not found" });
      }

      res.json({ escrow });
    } catch (error: any) {
      console.error("Error releasing escrow:", error);
      res.status(500).json({ error: "Failed to release escrow" });
    }
  });

  app.get("/api/escrow/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const escrows = listEscrowsForTenant(userId);
      res.json(escrows);
    } catch (error: any) {
      console.error("Error listing escrows:", error);
      res.status(500).json({ error: "Failed to list escrows" });
    }
  });

  // legacy deposit endpoint for backwards compatibility
  app.post("/api/deposit", async (req, res) => {
    try {
      const { listingId, amount, currency, tenantId, landlordId } = req.body as CreateDepositParams;

      if (!listingId || !amount || !currency || !tenantId || !landlordId) {
        return res.status(400).json({ 
          error: "Missing required fields: listingId, amount, currency, tenantId, landlordId" 
        });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
      }

      const result = await createDepositSession({
        listingId,
        amount,
        currency,
        tenantId,
        landlordId,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error creating deposit session:", error);
      
      if (error.message.includes("LOCUS_API_KEY")) {
        return res.status(500).json({ error: "Locus API key not configured" });
      }

      res.status(500).json({ error: "Failed to create deposit session" });
    }
  });

  // community posts endpoints
  app.post("/api/community/posts", async (req, res) => {
    try {
      const { userId, postType, title, content, city, tags } = req.body;

      if (!userId || !postType || !title || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // mock post data
      const post = {
        id: Math.floor(Math.random() * 100000),
        userId,
        postType,
        title,
        content,
        city,
        tags: tags || [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json(post);
    } catch (error: any) {
      console.error("Error creating community post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.get("/api/community/posts", async (req, res) => {
    try {
      const city = req.query.city as string | undefined;
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

      const posts = [
        {
          id: 1,
          userId: "user_1",
          postType: "tip",
          title: "Best neighborhoods for families in SF",
          content: "After living here for 5 years, I've found that Noe Valley and Sunset are great for families. Good schools, parks, and safe streets.",
          city: "San Francisco",
          tags: ["family", "neighborhoods"],
          likesCount: 24,
          commentsCount: 8,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          userId: "user_2",
          postType: "question",
          title: "Parking situation in Mission District?",
          content: "I'm considering a place in Mission. How's the parking? Is street parking impossible or doable with patience?",
          city: "San Francisco",
          tags: ["parking", "mission"],
          likesCount: 12,
          commentsCount: 15,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      const filtered = city ? posts.filter(p => p.city === city) : posts;
      res.json(filtered.slice(0, limit));
    } catch (error: any) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // locus mcp payment endpoint
  app.post("/api/mcp/payment", async (req, res) => {
    try {
      const { amount, currency, description, recipientEmail, metadata } = req.body;

      if (!amount || !currency || !recipientEmail) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await createLocusMCPPayment({
        amount,
        currency,
        description,
        recipientEmail,
        metadata,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error creating MCP payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.get("/api/mcp/payment/:id/status", async (req, res) => {
    try {
      const paymentId = req.params.id;
      const result = await checkLocusMCPPaymentStatus(paymentId);
      res.json(result);
    } catch (error: any) {
      console.error("Error checking MCP payment status:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // saved listings endpoints
  app.post("/api/saved", async (req, res) => {
    try {
      const { userId, listingId, notes } = req.body;

      if (!userId || !listingId) {
        return res.status(400).json({ error: "Missing userId or listingId" });
      }

      const saved = {
        id: Math.floor(Math.random() * 100000),
        userId,
        listingId,
        notes,
        createdAt: new Date(),
      };

      res.json(saved);
    } catch (error: any) {
      console.error("Error saving listing:", error);
      res.status(500).json({ error: "Failed to save listing" });
    }
  });

  app.get("/api/saved/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const saved = await db
        .select()
        .from(schema.savedListings)
        .where(eq(schema.savedListings.userId, userId));
      
      res.json(saved);
    } catch (error: any) {
      console.error("Error fetching saved listings:", error);
      res.status(500).json({ error: "Failed to fetch saved listings" });
    }
  });

  app.delete("/api/saved/:listingId", async (req, res) => {
    try {
      const { userId } = req.body;
      const listingId = req.params.listingId;

      if (!userId || !listingId) {
        return res.status(400).json({ error: "Missing userId or listingId" });
      }

      await db
        .delete(schema.savedListings)
        .where(
          and(
            eq(schema.savedListings.userId, userId),
            eq(schema.savedListings.listingId, listingId)
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error unsaving listing:", error);
      res.status(500).json({ error: "Failed to unsave listing" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
