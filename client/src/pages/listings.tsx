import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@shared/schema";

export default function Listings() {
  const { user } = useAuth();

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your rental properties and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-filter">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Link href="/listings/new">
            <Button data-testid="button-create-listing">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </Link>
        </div>
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
              onView={() => window.location.href = `/listings/${listing.id}`}
              onMessage={() => {}}
              onSave={() => {}}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-24 w-24 bg-muted rounded-full mx-auto flex items-center justify-center">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No listings yet</h3>
            <p className="text-muted-foreground">
              Create your first listing to start connecting with potential tenants
            </p>
            <Link href="/listings/new">
              <Button size="lg" data-testid="button-create-first-listing">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
