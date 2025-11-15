import { useMutation } from "@tanstack/react-query";
import type { Listing, CreateDepositResponse } from "../../../shared/types";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FeedCardProps {
  listing: Listing;
}

const sourceBadgeText: Record<string, string> = {
  internal: "Livva",
  zillow: "Zillow",
  apartments: "Apartments.com",
};

export function FeedCard({ listing }: FeedCardProps) {
  const { toast } = useToast();

  const createDepositMutation = useMutation<CreateDepositResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listingId: listing.id,
          amount: listing.price,
          currency: "usd",
          tenantId: "tenant_temp_001",
          landlordId: "landlord_temp_001",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create deposit session");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Deposit session created:", data.checkoutUrl);
      toast({
        title: "Deposit session created",
        description: "Redirecting to Locus checkout soon.",
      });
      setTimeout(() => {
        window.open(data.checkoutUrl, "_blank");
      }, 1500);
    },
    onError: (error) => {
      console.error("Error creating deposit:", error);
      toast({
        title: "Error",
        description: "Failed to create deposit session. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="overflow-hidden flex flex-col h-full" data-testid={`card-listing-${listing.id}`}>
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
          data-testid={`img-listing-${listing.id}`}
        />
      </div>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight" data-testid={`text-title-${listing.id}`}>
            {listing.title}
          </h3>
          <Badge variant="secondary" className="shrink-0" data-testid={`badge-source-${listing.id}`}>
            {sourceBadgeText[listing.source]}
          </Badge>
        </div>
        <p className="text-2xl font-bold" data-testid={`text-price-${listing.id}`}>
          ${listing.price.toLocaleString()} / month
        </p>
        <p className="text-sm text-muted-foreground" data-testid={`text-address-${listing.id}`}>
          {listing.address}, {listing.city}, {listing.state}
        </p>
        {(listing.bedrooms !== undefined || listing.bathrooms !== undefined || listing.sqft !== undefined) && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            {listing.bedrooms !== undefined && (
              <span>{listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}</span>
            )}
            {listing.bathrooms !== undefined && (
              <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</span>
            )}
            {listing.sqft !== undefined && (
              <span>{listing.sqft.toLocaleString()} sqft</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-description-${listing.id}`}>
          {listing.description}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => console.log("View details:", listing.id)}
          data-testid={`button-details-${listing.id}`}
        >
          View details
        </Button>
        <Button
          className="flex-1"
          onClick={() => createDepositMutation.mutate()}
          disabled={createDepositMutation.isPending}
          data-testid={`button-hold-${listing.id}`}
        >
          {createDepositMutation.isPending ? "Creating..." : "Hold with Locus"}
        </Button>
      </CardFooter>
    </Card>
  );
}
