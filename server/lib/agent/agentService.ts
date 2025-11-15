import type { Listing, FeedResponse } from "../../../shared/types";
import { getZillowListings } from "../integrations/zillow";
import { getApartmentsListings } from "../integrations/apartmentsDotCom";
import { generateMockListings } from "../integrations/mockListingGenerator";

export interface GetFeedOptions {
  page: number;
  pageSize: number;
  cityFilter?: string;
  maxPrice?: number;
  searchQuery?: string;
}

function getInternalListings(): Listing[] {
  return generateMockListings(20, "internal");
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
