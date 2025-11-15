import type { Listing } from "../../../shared/types";

export async function getZillowListings(): Promise<Listing[]> {
  await new Promise(resolve => setTimeout(resolve, 200));

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
