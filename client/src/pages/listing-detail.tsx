import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Bed, Bath, Maximize, Calendar } from "lucide-react";
import type { Listing } from "../../../shared/types";

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const { toast } = useToast();
  const listingId = params?.id;

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ["/api/listing", listingId],
    queryFn: async () => {
      const response = await fetch(`/api/listing/${listingId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch listing");
      }
      return response.json();
    },
    enabled: !!listingId,
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!listing) throw new Error("No listing data");
      
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listingId: listing.id,
          amount: listing.price,
          currency: "usd",
          tenantId: "tenant_mock",
          landlordId: "landlord_mock",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create deposit session");
      }

      const data = await response.json();
      console.log("Deposit session created:", data.checkoutUrl);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit session created",
        description: `Checkout URL: ${data.checkoutUrl}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deposit session",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const availableDate = listing.availableFrom
    ? new Date(listing.availableFrom).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Immediately";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="aspect-[16/9] overflow-hidden rounded-lg">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              data-testid="img-listing"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" data-testid="text-title">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="text-address">
                    {listing.address}, {listing.city}, {listing.state}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-primary" data-testid="text-price">
                  ${listing.price.toLocaleString()}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </div>
                <Badge variant="secondary" className="mt-2" data-testid="badge-source">
                  {listing.source === "internal" ? "Livva" : 
                   listing.source === "zillow" ? "Zillow" : "Apartments.com"}
                </Badge>
              </div>
            </div>

            <div className="flex gap-6 py-4 border-y">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <span data-testid="text-beds">
                  {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms ?? 0} bed${(listing.bedrooms ?? 0) > 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <span data-testid="text-baths">
                  {listing.bathrooms ?? 0} bath{(listing.bathrooms ?? 0) > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="h-5 w-5 text-muted-foreground" />
                <span data-testid="text-sqft">{listing.sqft} sqft</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span data-testid="text-available">Available {availableDate}</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
                {listing.description}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                className="flex-1"
                onClick={() => depositMutation.mutate()}
                disabled={depositMutation.isPending}
                data-testid="button-hold"
              >
                {depositMutation.isPending ? "Processing..." : "Hold with Locus"}
              </Button>
              <Button variant="outline" className="flex-1" data-testid="button-contact">
                Contact Landlord
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
