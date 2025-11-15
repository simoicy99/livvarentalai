export interface ZillowSearchParams {
  searchValue?: string;
  minBeds?: number;
  maxBeds?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  neLat: number;
  neLong: number;
  swLat: number;
  swLong: number;
  zoomValue?: number;
  pagination?: number;
}

interface ZillowListing {
  zpid: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  imgSrc: string;
  detailUrl: string;
  hdpUrl: string;
  latitude: number;
  longitude: number;
  statusText?: string;
}

export async function fetchZillowListings(params: ZillowSearchParams): Promise<ZillowListing[]> {
  const {
    searchValue = "San Francisco, CA",
    minBeds,
    maxBeds,
    minBathrooms,
    maxBathrooms,
    minPrice,
    maxPrice,
    neLat = 37.8324,
    neLong = -122.3542,
    swLat = 37.7039,
    swLong = -122.5155,
    zoomValue = 12,
    pagination = 1,
  } = params;

  const headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "origin": "https://www.zillow.com",
    "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  const filterState: any = {
    "sortSelection": { "value": "globalrelevanceex" },
    "isForRent": { "value": true },
    "isAllHomes": { "value": true },
  };

  if (minBeds !== undefined || maxBeds !== undefined) {
    const beds: any = {};
    if (minBeds !== undefined) beds.min = minBeds;
    if (maxBeds !== undefined) beds.max = maxBeds;
    filterState.beds = beds;
  }

  if (minBathrooms !== undefined || maxBathrooms !== undefined) {
    const baths: any = {};
    if (minBathrooms !== undefined) baths.min = minBathrooms;
    if (maxBathrooms !== undefined) baths.max = maxBathrooms;
    filterState.baths = baths;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const price: any = {};
    if (minPrice !== undefined) price.min = minPrice;
    if (maxPrice !== undefined) price.max = maxPrice;
    filterState.price = price;
  }

  const inputData = {
    searchQueryState: {
      isMapVisible: true,
      isListVisible: true,
      mapBounds: {
        north: neLat,
        east: neLong,
        south: swLat,
        west: swLong,
      },
      filterState,
      mapZoom: zoomValue,
      pagination: {
        currentPage: pagination,
      },
      usersSearchTerm: searchValue,
    },
    wants: {
      cat1: ["listResults", "mapResults"],
      cat2: ["total"],
    },
    requestId: 10,
    isDebugRequest: false,
  };

  try {
    const response = await fetch("https://www.zillow.com/async-create-search-page-state", {
      method: "PUT",
      headers,
      body: JSON.stringify(inputData),
    });

    if (!response.ok) {
      console.error("Zillow API error:", response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const searchResults = data?.cat1?.searchResults?.mapResults || [];

    return searchResults
      .filter((listing: any) => listing && listing.zpid)
      .map((listing: any) => ({
        zpid: listing.zpid,
        address: listing.address || "Unknown",
        city: listing.addressCity || "San Francisco",
        state: listing.addressState || "CA",
        price: listing.price || listing.unformattedPrice || 0,
        bedrooms: listing.beds || 0,
        bathrooms: listing.baths || 0,
        livingArea: listing.area || 0,
        imgSrc: listing.imgSrc || "",
        detailUrl: listing.detailUrl || "",
        hdpUrl: listing.hdpUrl || "",
        latitude: listing.latLong?.latitude || swLat,
        longitude: listing.latLong?.longitude || swLong,
        statusText: listing.statusText || "For Rent",
      }));
  } catch (error) {
    console.error("Error fetching Zillow listings:", error);
    return [];
  }
}
