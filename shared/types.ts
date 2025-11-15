export type ListingSource = "internal" | "zillow" | "apartments";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  imageUrl: string;
  source: ListingSource;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  availableFrom?: string;
  createdAt?: string;
}

export interface FeedResponse {
  items: Listing[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateDepositParams {
  listingId: string;
  amount: number;
  currency: string;
  tenantId: string;
  landlordId: string;
}

export interface CreateDepositResponse {
  sessionId: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  budgetMin: number;
  budgetMax: number;
  preferredCities: string[];
  bedrooms?: number;
  moveInDate?: string;
}

export type EscrowStatus = "pending" | "funded" | "released" | "refunded" | "failed";
export type PaymentChannel = "locus" | "stripe";

export interface EscrowRecord {
  id: string;
  listingId: string;
  tenantEmail: string;
  channel: PaymentChannel;
  amount: number;
  currency: string;
  status: EscrowStatus;
  locusTransactionId?: string;
  locusEscrowId?: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = "tenant" | "landlord" | "agent";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
}

export interface MatchResult {
  listing: Listing;
  score: number;
  reasons: string[];
}
