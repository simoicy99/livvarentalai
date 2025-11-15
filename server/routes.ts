import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateMatchScore } from "./aiService";
import Stripe from "stripe";
import multer from "multer";
import { Client } from "@replit/object-storage";
import {
  insertListingSchema,
  insertMessageSchema,
  insertMatchSchema,
  insertTenantPreferencesSchema,
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

if (!process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID) {
  throw new Error('Missing required environment variable: DEFAULT_OBJECT_STORAGE_BUCKET_ID. Please set up object storage.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

const objectStorageClient = new Client({
  bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID,
});
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.post('/api/upload-images', isAuthenticated, uploadMiddleware.array('images', 10), async (req: any, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedUrls: string[] = [];
      const files = req.files as Express.Multer.File[];

      for (const file of files) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const fileExt = file.originalname.split('.').pop() || 'jpg';
        const filename = `listing-${timestamp}-${randomId}.${fileExt}`;
        const objectPath = `public/${filename}`;

        const uploadResult = await objectStorageClient.uploadFromBytes(objectPath, file.buffer);
        
        if (!uploadResult.ok) {
          console.error('Upload failed for file:', filename, uploadResult.error);
          continue;
        }
        
        const publicUrl = `/${process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID}/${objectPath}`;
        uploadedUrls.push(publicUrl);
      }

      res.json({ urls: uploadedUrls });
    } catch (error: any) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Failed to upload images: " + error.message });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updatedUser = await storage.updateUserProfile(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/listings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertListingSchema.parse({
        ...req.body,
        landlordId: userId,
      });
      
      const listing = await storage.createListing(validatedData);
      
      await storage.createAgentActivity({
        userId,
        listingId: listing.id,
        activityType: "listing_posted",
        description: `AI agent posted listing: ${listing.title}`,
      });

      res.json(listing);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: error.message || "Failed to create listing" });
    }
  });

  app.get('/api/listings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.userType === "landlord" || user?.userType === "both") {
        const listings = await storage.getListings(userId);
        res.json(listings);
      } else {
        const listings = await storage.getListings();
        res.json(listings);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get('/api/listings/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listings = await storage.getListings(userId);
      res.json(listings.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get('/api/listings/search', async (req, res) => {
    try {
      const query = (req.query.query as string) || "";
      const listings = await storage.searchListings(query);
      res.json(listings);
    } catch (error) {
      console.error("Error searching listings:", error);
      res.status(500).json({ message: "Failed to search listings" });
    }
  });

  app.get('/api/listings/:id', async (req, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.patch('/api/listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await storage.getListing(req.params.id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.landlordId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateListing(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: error.message || "Failed to update listing" });
    }
  });

  app.delete('/api/listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await storage.getListing(req.params.id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.landlordId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteListing(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      res.status(400).json({ message: error.message || "Failed to delete listing" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });

      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      
      const messages = await storage.getMessages(currentUserId, otherUserId);
      await storage.markMessagesAsRead(currentUserId, otherUserId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listingId } = req.body;

      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const user = await storage.getUser(userId);
      const preferences = await storage.getTenantPreferences(userId);

      const { score, reasoning } = await generateMatchScore(listing, user!, preferences);

      const matchData = insertMatchSchema.parse({
        listingId,
        tenantId: userId,
        matchScore: score,
        aiReasoning: reasoning,
        status: "pending",
      });

      const match = await storage.createMatch(matchData);

      await storage.createAgentActivity({
        userId,
        listingId,
        activityType: "match_created",
        description: `AI created match with score ${Math.round(score)}%`,
      });

      res.json(match);
    } catch (error: any) {
      console.error("Error creating match:", error);
      res.status(400).json({ message: error.message || "Failed to create match" });
    }
  });

  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const userType = user?.userType === "landlord" ? "landlord" : "tenant";
      const matches = await storage.getMatches(userId, userType);
      
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get('/api/matches/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const userType = user?.userType === "landlord" ? "landlord" : "tenant";
      const matches = await storage.getMatches(userId, userType);
      
      res.json(matches.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.put('/api/matches/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const match = await storage.updateMatchStatus(req.params.id, status);
      res.json(match);
    } catch (error) {
      console.error("Error updating match status:", error);
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  app.get('/api/trust-score/:userId', async (req, res) => {
    try {
      const trustScore = await storage.getTrustScore(req.params.userId);
      res.json(trustScore || null);
    } catch (error) {
      console.error("Error fetching trust score:", error);
      res.status(500).json({ message: "Failed to fetch trust score" });
    }
  });

  app.get('/api/tenant-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getTenantPreferences(userId);
      res.json(preferences || null);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put('/api/tenant-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTenantPreferencesSchema.parse({
        ...req.body,
        userId,
      });

      const preferences = await storage.upsertTenantPreferences(validatedData);
      res.json(preferences);
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      res.status(400).json({ message: error.message || "Failed to update preferences" });
    }
  });

  app.get('/api/agent-activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activities = await storage.getAgentActivities(userId, 10);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching agent activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const stats = await storage.getDashboardStats(userId, user?.userType || "tenant");
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
