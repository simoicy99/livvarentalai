import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import * as schema from "../shared/schema";
import { getFeedPage } from "./lib/agent/agentService";
import { createDepositSession } from "./lib/integrations/locus";
import { matchListingsToTenant } from "./lib/agent/matchAgent";
import { generateInitialMessage, generateFollowUpMessage } from "./lib/agent/communicationAgent";
import { createDeposit, checkDepositStatus, releaseDeposit, releaseDepositWithDetails, getEscrowsByTenant } from "./lib/agent/paymentsAgent";
import { listEscrowsForTenant } from "./lib/services/escrowService";
import { createRentPayment, listPaymentsForTenant } from "./lib/services/rentPaymentService";
import { createLocusMCPPayment, checkLocusMCPPaymentStatus } from "./lib/agent/locusMCPAgent";
import { getTrustProfile, getAllTrustProfiles, recordEvent as recordTrustEvent } from "./lib/agent/trustScoreAgent";
import { getAllVerificationCases, getVerificationCase, addUpload } from "./lib/agent/moveInVerificationAgent";
import { getPenaltyEvents, applyPenalty as applyBehaviorPenalty } from "./lib/agent/badBehaviorAgent";
import type { CreateDepositParams, TenantProfile } from "../shared/types";
import { clerkClient } from "./lib/clerk";
import { getLocusTools } from "./lib/integrations/locusMCPClient";

export function registerRoutes(app: Express): Server {
  app.get("/api/auth/user", async (req, res) => {
    try {
      const { userId } = req.auth || {};
      
      if (!userId) {
        return res.json(null);
      }

      const user = await clerkClient.users.getUser(userId);
      
      res.json({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

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
      const { listingId, tenantEmail, landlordEmail, baseAmount, currency, channelPreference } = req.body;

      if (!listingId || !tenantEmail || !baseAmount) {
        return res.status(400).json({ 
          error: "Missing required fields: listingId, tenantEmail, baseAmount" 
        });
      }

      const result = await createDeposit({
        listingId,
        tenantEmail,
        landlordEmail,
        baseAmount,
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

      const result = await releaseDepositWithDetails(escrowId);

      if (!result) {
        return res.status(404).json({ error: "Escrow not found" });
      }

      res.json(result);
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

  app.post("/api/rent/payment", async (req, res) => {
    try {
      const { listingId, listingTitle, landlordEmail, landlordName, amount: rawAmount, currency, tenantEmail, period } = req.body;

      if (!listingId || !listingTitle || rawAmount == null || !tenantEmail) {
        return res.status(400).json({ 
          error: "Missing required fields: listingId, listingTitle, amount, tenantEmail" 
        });
      }

      const amount = Number(rawAmount);
      if (!isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a valid positive number" });
      }

      // simulate stripe payment processing
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      console.log(`Processing rent payment: ${tenantEmail} paying $${amount} for ${listingTitle}`);

      // persist payment record
      const payment = createRentPayment({
        listingId,
        listingTitle,
        landlordEmail,
        landlordName,
        tenantEmail,
        amount,
        currency: currency || "usd",
        paymentIntentId,
        period,
      });

      // record trust event for on-time payment
      try {
        recordTrustEvent(tenantEmail, 'ON_TIME_RENT_PAYMENT', `Rent payment of $${amount} for ${listingTitle}`);
        console.log(`Trust score updated for ${tenantEmail} (+10 points)`);
      } catch (trustError) {
        console.error("Failed to update trust score:", trustError);
        // continue - payment succeeded even if trust update failed
      }

      console.log(`Rent payment successful: ${paymentIntentId}, payment ID: ${payment.id}`);

      res.json({
        success: true,
        paymentId: payment.id,
        paymentIntentId,
        amount,
        currency: payment.currency,
        status: "succeeded",
        message: "Payment processed successfully. Your trust score has been improved!",
      });
    } catch (error: any) {
      console.error("Error processing rent payment:", error);
      res.status(500).json({ error: error.message || "Failed to process payment" });
    }
  });

  app.get("/api/rent/payments/:tenantEmail", async (req, res) => {
    try {
      const { tenantEmail } = req.params;

      if (!tenantEmail) {
        return res.status(400).json({ error: "Missing tenantEmail" });
      }

      const payments = listPaymentsForTenant(tenantEmail);
      res.json(payments);
    } catch (error: any) {
      console.error("Error listing rent payments:", error);
      res.status(500).json({ error: "Failed to list rent payments" });
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

  app.post("/api/locus/prompt", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: "Missing or invalid prompt" });
      }

      const { getLocusAgent } = await import("./lib/agent/locusMCPAgent");
      const agent = await getLocusAgent();
      
      if (!agent) {
        return res.status(503).json({ 
          error: "Locus agent not available", 
          response: "Locus MCP agent is not configured. Please check LOCUS_CLIENT_ID and LOCUS_CLIENT_SECRET environment variables." 
        });
      }

      const result = await agent.invoke({
        messages: [{ role: "user", content: prompt }]
      });

      const lastMessage = result.messages[result.messages.length - 1];
      const response = lastMessage?.content || "Agent executed successfully";

      res.json({ 
        success: true, 
        response: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
        messages: result.messages
      });
    } catch (error: any) {
      console.error("Error executing Locus prompt:", error);
      res.status(500).json({ 
        error: "Failed to execute Locus agent", 
        response: `Error: ${error.message || 'Unknown error'}`
      });
    }
  });

  // trust score endpoints
  app.get("/api/trust/:email", async (req, res) => {
    try {
      const email = req.params.email;
      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }

      const profile = getTrustProfile(email);
      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching trust profile:", error);
      res.status(500).json({ error: "Failed to fetch trust profile" });
    }
  });

  app.get("/api/trust", async (req, res) => {
    try {
      const profiles = getAllTrustProfiles();
      res.json(profiles);
    } catch (error: any) {
      console.error("Error fetching trust profiles:", error);
      res.status(500).json({ error: "Failed to fetch trust profiles" });
    }
  });

  app.post("/api/trust/event", async (req, res) => {
    try {
      const { email, eventType, reason } = req.body;
      if (!email || !eventType) {
        return res.status(400).json({ error: "Missing email or eventType" });
      }

      const profile = recordTrustEvent(email, eventType, reason);
      res.json(profile);
    } catch (error: any) {
      console.error("Error recording trust event:", error);
      res.status(500).json({ error: "Failed to record trust event" });
    }
  });

  // verification endpoints
  app.get("/api/verification", async (req, res) => {
    try {
      const cases = getAllVerificationCases();
      res.json(cases);
    } catch (error: any) {
      console.error("Error fetching verification cases:", error);
      res.status(500).json({ error: "Failed to fetch verification cases" });
    }
  });

  app.get("/api/verification/:escrowId", async (req, res) => {
    try {
      const escrowId = req.params.escrowId;
      if (!escrowId) {
        return res.status(400).json({ error: "Missing escrowId" });
      }

      const verificationCase = getVerificationCase(escrowId);
      if (!verificationCase) {
        return res.status(404).json({ error: "Verification case not found" });
      }

      res.json(verificationCase);
    } catch (error: any) {
      console.error("Error fetching verification case:", error);
      res.status(500).json({ error: "Failed to fetch verification case" });
    }
  });

  app.post("/api/verification/:escrowId/upload", async (req, res) => {
    try {
      const escrowId = req.params.escrowId;
      const upload = req.body;

      if (!escrowId || !upload) {
        return res.status(400).json({ error: "Missing escrowId or upload data" });
      }

      addUpload(escrowId, upload);
      const verificationCase = getVerificationCase(escrowId);

      res.json(verificationCase);
    } catch (error: any) {
      console.error("Error adding upload:", error);
      res.status(500).json({ error: "Failed to add upload" });
    }
  });

  // penalty endpoints
  app.get("/api/penalties", async (req, res) => {
    try {
      const email = req.query.email as string | undefined;
      const penalties = getPenaltyEvents(email);
      res.json(penalties);
    } catch (error: any) {
      console.error("Error fetching penalties:", error);
      res.status(500).json({ error: "Failed to fetch penalties" });
    }
  });

  app.post("/api/penalties", async (req, res) => {
    try {
      const { eventType, fromEmail, toEmail, reason, amount } = req.body;

      if (!eventType || !fromEmail || !toEmail || !reason) {
        return res.status(400).json({ 
          error: "Missing required fields: eventType, fromEmail, toEmail, reason" 
        });
      }

      const penalty = await applyBehaviorPenalty({
        eventType,
        fromEmail,
        toEmail,
        reason,
        amount,
      });

      res.json(penalty);
    } catch (error: any) {
      console.error("Error applying penalty:", error);
      res.status(500).json({ error: error.message || "Failed to apply penalty" });
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
      const listingIdStr = req.params.listingId;
      const listingId = parseInt(listingIdStr, 10);

      if (!userId || isNaN(listingId)) {
        return res.status(400).json({ error: "Missing or invalid userId or listingId" });
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

  app.get("/api/debug/locus", async (req, res) => {
    try {
      const tools = await getLocusTools();
      res.json({ ok: true, tools });
    } catch (err: any) {
      console.error("Error fetching Locus tools:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
