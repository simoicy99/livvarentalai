import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search as SearchIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@shared/schema";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings/search", searchQuery],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Search Rentals</h1>
        <p className="text-muted-foreground mt-1">
          Find your perfect rental with AI-powered matching
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by city, neighborhood, or property type..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Button variant="outline" data-testid="button-filter">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onView={() => window.location.href = `/listing/${listing.id}`}
              onMessage={() => window.location.href = `/messages?listing=${listing.id}`}
              onSave={() => {}}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-4">
            <SearchIcon className="h-24 w-24 text-muted-foreground mx-auto" />
            <h3 className="text-xl font-semibold">
              {searchQuery ? "No results found" : "Start searching"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Enter a location to find available rentals"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
