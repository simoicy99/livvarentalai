import type { Listing } from "../../../shared/types";
import { fetchZillowListings } from "./zillowFetcher";
import { generateMockListings } from "./mockListingGenerator";

export async function getZillowListings(): Promise<Listing[]> {
  try {
    console.log("Fetching real Zillow listings for San Francisco...");
    const zillowData = await fetchZillowListings({
      searchValue: "San Francisco, CA",
      neLat: 37.8324,
      neLong: -122.3542,
      swLat: 37.7039,
      swLong: -122.5155,
      zoomValue: 12,
      minPrice: 1000,
      maxPrice: 10000,
    });

    if (!zillowData || zillowData.length === 0) {
      console.warn("No Zillow listings found, using fallback data");
      return getFallbackListings();
    }

    console.log(`Fetched ${zillowData.length} real Zillow listings`);
    return zillowData.map((listing, index) => ({
      id: `zillow_real_${listing.zpid}`,
      title: listing.bedrooms > 0 
        ? `${listing.bedrooms}BR${listing.bathrooms > 0 ? ` / ${listing.bathrooms}BA` : ''} in ${listing.city}`
        : `Studio in ${listing.city}`,
      description: `Available for rent at ${listing.address}. ${listing.livingArea > 0 ? listing.livingArea + ' sqft with' : ''} ${listing.bedrooms} bedroom${listing.bedrooms !== 1 ? 's' : ''} and ${listing.bathrooms} bathroom${listing.bathrooms !== 1 ? 's' : ''}.`,
      price: listing.price,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      imageUrl: listing.imgSrc || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      source: "zillow",
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.livingArea,
      availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error getting real Zillow listings, using fallback:", error);
    return getFallbackListings();
  }
}

function getFallbackListings(): Listing[] {
  return generateMockListings(22, "zillow");
}
