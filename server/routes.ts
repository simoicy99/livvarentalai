import type { Express } from "express";
import { createServer, type Server } from "http";
import { getFeedPage } from "./lib/agent/agentService";
import { createDepositSession } from "./lib/integrations/locus";
import { matchListingsToTenant } from "./lib/agent/matchAgent";
import { generateInitialMessage, generateFollowUpMessage } from "./lib/agent/communicationAgent";
import { createDeposit, checkDepositStatus, releaseDeposit } from "./lib/agent/paymentsAgent";
import { listEscrowsForTenant } from "./lib/services/escrowService";
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

      const result = await getFeedPage(page, pageSize, {
        cityFilter,
        maxPrice,
        searchQuery,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ error: "Failed to fetch feed" });
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

  app.get("/api/escrow", async (req, res) => {
    try {
      const { tenantEmail } = req.query;

      if (!tenantEmail || typeof tenantEmail !== "string") {
        return res.status(400).json({ error: "Missing tenantEmail" });
      }

      const escrows = listEscrowsForTenant(tenantEmail);
      res.json({ escrows });
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

  const httpServer = createServer(app);

  return httpServer;
}
