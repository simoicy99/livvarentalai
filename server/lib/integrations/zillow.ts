import type { Listing } from "../../../shared/types";
import { fetchZillowListings } from "./zillowFetcher";

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
  return [
    {
      id: "zillow_1",
      title: "Financial District High-Rise",
      description: "Beautiful loft in the heart of downtown with exposed brick, high ceilings, and floor-to-ceiling windows. Walking distance to restaurants, BART, and Ferry Building.",
      price: 3800,
      address: "123 Market Street",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      source: "zillow",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 900,
      availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "zillow_2",
      title: "Sunset District Family Home",
      description: "Charming 3-bedroom house with large backyard, updated kitchen, and plenty of natural light. Close to Golden Gate Park and Ocean Beach.",
      price: 6200,
      address: "456 Judah Street",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
      source: "zillow",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1900,
      availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "zillow_3",
      title: "Pacific Heights Penthouse",
      description: "Top floor penthouse with stunning bay views, marble countertops, and premium appliances. Includes parking, doorman, and rooftop garden access.",
      price: 7500,
      address: "789 Broadway",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      source: "zillow",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1500,
      availableFrom: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
