import type { Listing } from "../../../shared/types";

export async function getZillowListings(): Promise<Listing[]> {
  await new Promise(resolve => setTimeout(resolve, 200));

  return [
    {
      id: "zillow_1",
      title: "Modern Downtown Loft",
      description: "Beautiful loft in the heart of downtown with exposed brick, high ceilings, and floor-to-ceiling windows. Walking distance to restaurants and shops.",
      price: 2800,
      address: "123 Market Street",
      city: "San Francisco",
      state: "CA",
      imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      source: "zillow",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 850,
      availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "zillow_2",
      title: "Spacious Family Home",
      description: "Charming 3-bedroom house with large backyard, updated kitchen, and plenty of natural light. Perfect for families.",
      price: 3200,
      address: "456 Oak Avenue",
      city: "Austin",
      state: "TX",
      imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
      source: "zillow",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "zillow_3",
      title: "Luxury Penthouse Suite",
      description: "Top floor penthouse with stunning city views, marble countertops, and premium appliances. Includes parking and gym access.",
      price: 4500,
      address: "789 Skyline Drive",
      city: "Seattle",
      state: "WA",
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      source: "zillow",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1400,
      availableFrom: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
