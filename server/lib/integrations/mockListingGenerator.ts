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

const roomTypes = [
  "Private bedroom in shared 2BR apartment",
  "Private bedroom in shared 3BR apartment", 
  "Private bedroom in shared Victorian flat",
  "Private bedroom in shared house",
  "Private bedroom in shared townhouse",
  "Master bedroom in shared 2BR condo",
  "Furnished private room in shared apartment",
  "Large bedroom in shared Victorian",
  "Sunny room in shared flat",
  "Private room with private bathroom"
];

const roomFeatures = [
  "furnished", "unfurnished", "large closet", "plenty of natural light",
  "hardwood floors", "recently painted", "street views", "quiet",
  "spacious", "cozy", "bright"
];

const sharedAmenities = [
  "shared kitchen", "shared living room", "in-unit washer/dryer",
  "dishwasher", "central heating", "high-speed WiFi included",
  "utilities included", "cable included", "shared backyard",
  "shared balcony", "garage parking available", "bike storage",
  "pet-friendly building", "near public transit", "walking distance to BART",
  "close to cafes and restaurants", "street parking"
];

const roommateInfo = [
  "2 current roommates (working professionals)",
  "1 roommate (grad student)",
  "2 roommates (tech professionals)",
  "friendly household of 3",
  "quiet professional household",
  "LGBTQ+ friendly household",
  "420-friendly household",
  "no pets currently",
  "cat-friendly household"
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

function randomRoomPrice(neighborhood: string): number {
  const priceRanges: Record<string, [number, number]> = {
    "Pacific Heights": [1800, 2500],
    "Marina District": [1700, 2400],
    "Russian Hill": [1700, 2400],
    "North Beach": [1600, 2200],
    "Financial District": [1800, 2500],
    "SoMa": [1700, 2300],
    "Mission District": [1400, 2000],
    "Castro": [1500, 2100],
    "Hayes Valley": [1500, 2100],
    "Noe Valley": [1600, 2200],
    "Potrero Hill": [1500, 2100],
    "Dogpatch": [1400, 2000],
    "Bernal Heights": [1300, 1900],
    "Cole Valley": [1500, 2100],
    "Haight-Ashbury": [1300, 1900],
    "Lower Haight": [1300, 1800],
    "Inner Richmond": [1300, 1900],
    "Outer Richmond": [1200, 1700],
    "Inner Sunset": [1300, 1900],
    "Sunset District": [1200, 1700],
    "Outer Sunset": [1100, 1600],
    "Glen Park": [1300, 1800],
    "Excelsior": [1100, 1500],
    "Bayview": [1000, 1400],
    "Visitacion Valley": [1000, 1400],
  };

  const [min, max] = priceRanges[neighborhood] || [1200, 1800];
  return Math.round((min + Math.random() * (max - min)) / 50) * 50;
}

function generateRoomDescription(neighborhood: string, roomType: string): string {
  const feature1 = randomItem(roomFeatures);
  const feature2 = randomItem(roomFeatures);
  const amenity1 = randomItem(sharedAmenities);
  const amenity2 = randomItem(sharedAmenities);
  const amenity3 = randomItem(sharedAmenities);
  const roommates = randomItem(roommateInfo);
  
  return `${roomType} available in ${neighborhood}. Room is ${feature1} and ${feature2}. Apartment features ${amenity1}, ${amenity2}, and ${amenity3}. ${roommates}. Move-in ready!`;
}

export function generateMockListings(count: number, source: "internal" | "zillow" | "apartments"): Listing[] {
  const listings: Listing[] = [];
  
  for (let i = 0; i < count; i++) {
    const neighborhood = randomItem(sfNeighborhoods);
    const street = randomItem(sfStreets);
    const roomType = randomItem(roomTypes);
    const price = randomRoomPrice(neighborhood);
    const daysAvailable = Math.floor(Math.random() * 45) + 1;
    const daysAgo = Math.floor(Math.random() * 14);
    
    const hasPrivateBath = roomType.includes("private bathroom");
    const sqft = 120 + Math.floor(Math.random() * 80);

    listings.push({
      id: `${source}_${i + 1}`,
      title: `Private Room in ${neighborhood}`,
      description: generateRoomDescription(neighborhood, roomType),
      price,
      address: `${Math.floor(Math.random() * 3000) + 100} ${street}`,
      city: "San Francisco",
      state: "CA",
      imageUrl: `https://images.unsplash.com/${randomItem(unsplashImages)}?w=800`,
      source,
      bedrooms: 1,
      bathrooms: hasPrivateBath ? 1 : 0.5,
      sqft,
      availableFrom: new Date(Date.now() + daysAvailable * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return listings;
}
