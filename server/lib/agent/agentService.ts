import type { Listing, FeedResponse } from "../../../shared/types";
import { getZillowListings } from "../integrations/zillow";
import { getApartmentsListings } from "../integrations/apartmentsDotCom";

export interface GetFeedOptions {
  page: number;
  pageSize: number;
  cityFilter?: string;
  maxPrice?: number;
  searchQuery?: string;
}

function getInternalListings(): Listing[] {
  return [
    {
      id: "livva_1",
      title: "Sunny Mission District Loft",
      description: "Bright corner loft with wrap-around windows and city views. Features central AC, in-unit washer/dryer, and modern appliances. Walking distance to Dolores Park.",
      price: 3200,
      address: "2845 Mission Street",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      source: "internal",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 850,
      availableFrom: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "livva_2",
      title: "Noe Valley Family Home",
      description: "Spacious Victorian with fenced backyard, perfect for families. Close to parks, schools, and 24th Street shops. Recently updated kitchen.",
      price: 5800,
      address: "567 Sanchez Street",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800",
      source: "internal",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      availableFrom: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "livva_3",
      title: "SoMa Modern Studio",
      description: "Efficient studio in modern building with 24/7 gym, rooftop deck, and concierge service. Steps from BART and tech shuttle stops.",
      price: 2600,
      address: "890 Folsom Street",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
      source: "internal",
      bedrooms: 0,
      bathrooms: 1,
      sqft: 550,
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
  filters?: { cityFilter?: string; maxPrice?: number; searchQuery?: string }
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

  if (filters?.searchQuery) {
    const queryLower = filters.searchQuery.toLowerCase();
    allListings = allListings.filter(listing => {
      return (
        listing.title.toLowerCase().includes(queryLower) ||
        listing.description.toLowerCase().includes(queryLower) ||
        listing.city.toLowerCase().includes(queryLower) ||
        listing.address.toLowerCase().includes(queryLower)
      );
    });
  }

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
