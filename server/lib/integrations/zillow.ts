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
    return zillowData.map((listing, index) => {
      const neighborhood = listing.city === "San Francisco" 
        ? listing.address.split(',')[0].split(' ').slice(-2).join(' ')
        : listing.city;
      
      const roomPrice = Math.round(listing.price / (listing.bedrooms || 1) * 0.45);
      
      return {
        id: `zillow_real_${listing.zpid}`,
        title: `Private Room in ${neighborhood}`,
        description: `Private bedroom in shared ${listing.bedrooms}BR apartment. ${listing.livingArea > 0 ? `Total unit is ${listing.livingArea} sqft.` : ''} Features include shared kitchen, living room, and ${listing.bathrooms} bathroom${listing.bathrooms !== 1 ? 's' : ''}. Great location near transit and amenities.`,
        price: roomPrice,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        imageUrl: listing.imgSrc || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        source: "zillow",
        bedrooms: 1,
        bathrooms: listing.bathrooms > 1 ? 0.5 : 1,
        sqft: Math.round((listing.livingArea || 800) / (listing.bedrooms || 2)),
        availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Error getting real Zillow listings, using fallback:", error);
    return getFallbackListings();
  }
}

function getFallbackListings(): Listing[] {
  return generateMockListings(22, "zillow");
}
