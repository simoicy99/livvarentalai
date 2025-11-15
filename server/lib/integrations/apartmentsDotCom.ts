import type { Listing } from "../../../shared/types";
import { generateMockListings } from "./mockListingGenerator";

export async function getApartmentsListings(): Promise<Listing[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return generateMockListings(18, "apartments");
}
