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

export interface GetFeedOptions {
  page: number;
  pageSize: number;
  cityFilter?: string;
  maxPrice?: number;
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
