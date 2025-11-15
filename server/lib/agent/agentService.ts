import type { Listing, FeedResponse } from "../../../shared/types";
import { getZillowListings } from "../integrations/zillow";
import { getApartmentsListings } from "../integrations/apartmentsDotCom";

export interface GetFeedOptions {
  page: number;
  pageSize: number;
  cityFilter?: string;
  maxPrice?: number;
}

function getInternalListings(): Listing[] {
  return [
    {
      id: "livva_1",
      title: "Sunny Corner Unit",
      description: "Bright corner apartment with wrap-around windows and city views. Features include central AC, in-unit washer/dryer, and modern appliances.",
      price: 2100,
      address: "234 Main Street",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      source: "internal",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 750,
      availableFrom: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "livva_2",
      title: "Pet-Friendly Duplex",
      description: "Spacious duplex with fenced yard, perfect for pet owners. Close to dog parks and walking trails.",
      price: 2600,
      address: "567 Elm Drive",
      city: "Portland",
      state: "OR",
      imageUrl: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800",
      source: "internal",
      bedrooms: 2,
      bathrooms: 1.5,
      sqft: 1100,
      availableFrom: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "livva_3",
      title: "Downtown Studio with Gym",
      description: "Efficient studio in modern building with 24/7 gym, rooftop deck, and concierge service. Steps from metro.",
      price: 1800,
      address: "890 Commerce Way",
      city: "Seattle",
      state: "WA",
      imageUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
      source: "internal",
      bedrooms: 0,
      bathrooms: 1,
      sqft: 500,
      availableFrom: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function getFeedListings(options: GetFeedOptions): Promise<Listing[]> {
  const [internalListings, zillowListings, apartmentsListings] = await Promise.all([
    Promise.resolve(getInternalListings()),
    getZillowListings(),
    getApartmentsListings(),
  ]);

  let allListings = [...internalListings, ...zillowListings, ...apartmentsListings];

  if (options.cityFilter) {
    const cityLower = options.cityFilter.toLowerCase();
    allListings = allListings.filter(
      listing => listing.city.toLowerCase() === cityLower
    );
  }

  if (options.maxPrice !== undefined) {
    allListings = allListings.filter(
      listing => listing.price <= options.maxPrice!
    );
  }

  allListings.sort((a, b) => {
    if (a.availableFrom && b.availableFrom) {
      return new Date(a.availableFrom).getTime() - new Date(b.availableFrom).getTime();
    }
    if (a.availableFrom) return -1;
    if (b.availableFrom) return 1;

    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;

    return a.price - b.price;
  });

  const startIndex = (options.page - 1) * options.pageSize;
  const endIndex = startIndex + options.pageSize;

  return allListings.slice(startIndex, endIndex);
}

export async function getFeedPage(
  page: number,
  pageSize: number,
  filters?: { cityFilter?: string; maxPrice?: number }
): Promise<FeedResponse> {
  const options: GetFeedOptions = {
    page,
    pageSize,
    ...filters,
  };

  const [internalListings, zillowListings, apartmentsListings] = await Promise.all([
    Promise.resolve(getInternalListings()),
    getZillowListings(),
    getApartmentsListings(),
  ]);

  let allListings = [...internalListings, ...zillowListings, ...apartmentsListings];

  if (filters?.cityFilter) {
    const cityLower = filters.cityFilter.toLowerCase();
    allListings = allListings.filter(
      listing => listing.city.toLowerCase() === cityLower
    );
  }

  if (filters?.maxPrice !== undefined) {
    allListings = allListings.filter(
      listing => listing.price <= filters.maxPrice!
    );
  }

  allListings.sort((a, b) => {
    if (a.availableFrom && b.availableFrom) {
      return new Date(a.availableFrom).getTime() - new Date(b.availableFrom).getTime();
    }
    if (a.availableFrom) return -1;
    if (b.availableFrom) return 1;

    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;

    return a.price - b.price;
  });

  const totalCount = allListings.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = allListings.slice(startIndex, endIndex);
  const hasMore = endIndex < totalCount;

  return {
    items,
    page,
    pageSize,
    hasMore,
  };
}
