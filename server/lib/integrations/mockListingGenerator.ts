import type { Listing } from "../../../shared/types";

const sfNeighborhoods = [
  "Mission District", "Noe Valley", "SoMa", "Financial District", "Sunset District",
  "Pacific Heights", "Hayes Valley", "Marina District", "Castro", "North Beach",
  "Russian Hill", "Potrero Hill", "Dogpatch", "Bernal Heights", "Inner Richmond",
  "Outer Richmond", "Haight-Ashbury", "Lower Haight", "Cole Valley", "Glen Park",
  "Excelsior", "Bayview", "Visitacion Valley", "Outer Sunset", "Inner Sunset"
];

const sfStreets = [
  "Mission St", "Valencia St", "Folsom St", "Market St", "Geary Blvd",
  "Van Ness Ave", "California St", "Broadway", "Divisadero St", "Polk St",
  "Church St", "Castro St", "Columbus Ave", "Grant Ave", "Stockton St",
  "Judah St", "Irving St", "Taraval St", "Noriega St", "Ortega St"
];

const propertyTypes = [
  "Victorian Flat", "Modern Loft", "Garden Apartment", "Penthouse", "Studio",
  "Townhouse", "Condo", "Duplex", "Family Home", "High-Rise Apartment"
];

const amenities = [
  "hardwood floors", "stainless steel appliances", "granite countertops",
  "in-unit washer/dryer", "central AC", "balcony", "rooftop deck access",
  "garage parking", "bike storage", "gym access", "concierge service",
  "pet-friendly", "recently renovated", "natural light", "bay views",
  "city views", "walk-in closets", "dishwasher", "fireplace"
];

const unsplashImages = [
  "photo-1522708323590-d24dbb6b0267",
  "photo-1502672260266-1c1ef2d93688",
  "photo-1568605114967-8130f3a36994",
  "photo-1512917774080-9991f1c4c750",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1558036117-15d82a90b9b1",
  "photo-1536376072261-38c75010e6c9",
  "photo-1460317442991-0ec209397118",
  "photo-1493809842364-78817add7ffb",
  "photo-1484154218962-a197022b5858",
  "photo-1522771739844-6a9f6d5f14af",
  "photo-1574643156929-51fa098b0394",
  "photo-1521401830884-6c03c1c87ebb",
  "photo-1554995207-c18c203602cb",
  "photo-1571624436279-b272aff752b5",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice(bedrooms: number): number {
  const basePrices = [2400, 2800, 3200, 3800, 4500, 5200, 6000, 7500];
  const bedroomMultiplier = bedrooms === 0 ? 0.8 : bedrooms * 0.4;
  const basePrice = randomItem(basePrices);
  return Math.round(basePrice * (1 + bedroomMultiplier));
}

function generateDescription(bedrooms: number, bathrooms: number, neighborhood: string): string {
  const features = [
    randomItem(amenities),
    randomItem(amenities),
    randomItem(amenities),
  ];
  
  const intro = bedrooms === 0
    ? "Efficient studio layout with"
    : `Spacious ${bedrooms}BR / ${bathrooms}BA with`;
  
  return `${intro} ${features[0]}, ${features[1]}, and ${features[2]}. Located in vibrant ${neighborhood}. Close to transit, dining, and parks.`;
}

export function generateMockListings(count: number, source: "internal" | "zillow" | "apartments"): Listing[] {
  const listings: Listing[] = [];
  
  for (let i = 0; i < count; i++) {
    const bedrooms = Math.floor(Math.random() * 4);
    const bathrooms = bedrooms === 0 ? 1 : Math.ceil(bedrooms / 2) + Math.floor(Math.random() * 2);
    const sqft = bedrooms === 0 
      ? 400 + Math.floor(Math.random() * 300)
      : 700 + (bedrooms * 400) + Math.floor(Math.random() * 400);
    
    const neighborhood = randomItem(sfNeighborhoods);
    const street = randomItem(sfStreets);
    const propertyType = randomItem(propertyTypes);
    const price = randomPrice(bedrooms);
    const daysAvailable = Math.floor(Math.random() * 45) + 1;
    const daysAgo = Math.floor(Math.random() * 14);

    listings.push({
      id: `${source}_${i + 1}`,
      title: bedrooms === 0
        ? `${neighborhood} ${propertyType}`
        : `${bedrooms}BR ${propertyType} in ${neighborhood}`,
      description: generateDescription(bedrooms, bathrooms, neighborhood),
      price,
      address: `${Math.floor(Math.random() * 3000) + 100} ${street}`,
      city: "San Francisco",
      state: "CA",
      imageUrl: `https://images.unsplash.com/${randomItem(unsplashImages)}?w=800`,
      source,
      bedrooms,
      bathrooms,
      sqft,
      availableFrom: new Date(Date.now() + daysAvailable * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return listings;
}
