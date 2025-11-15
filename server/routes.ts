import type { Express } from "express";
import { createServer, type Server } from "http";
import { getFeedPage } from "./lib/agent/agentService";
import { createDepositSession } from "./lib/integrations/locus";
import type { CreateDepositParams } from "../shared/types";

export function registerRoutes(app: Express): Server {
  app.get("/api/feed", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.max(1, Math.min(50, parseInt(req.query.pageSize as string) || 20));
      const cityFilter = req.query.city as string | undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

      const result = await getFeedPage(page, pageSize, {
        cityFilter,
        maxPrice,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ error: "Failed to fetch feed" });
    }
  });

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
