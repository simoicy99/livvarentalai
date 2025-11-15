import { Listing, TrustScore } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square, Heart, MessageSquare, Eye } from "lucide-react";
import { TrustScoreBadge } from "./trust-score-badge";
import { AgentActivityIndicator } from "./agent-activity-indicator";
import { motion } from "framer-motion";

interface ListingCardProps {
  listing: Listing;
  landlordName?: string;
  landlordTrustScore?: TrustScore | null;
  onView?: () => void;
  onMessage?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function ListingCard({
  listing,
  landlordName,
  landlordTrustScore,
  onView,
  onMessage,
  onSave,
  isSaved = false,
}: ListingCardProps) {
  const primaryImage = listing.images[0] || "/placeholder-property.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      data-testid={`card-listing-${listing.id}`}
    >
      <Card className="overflow-hidden hover-elevate active-elevate-2 transition-transform duration-200">
        <div className="relative aspect-[4/3] overflow-hidden group">
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 z-10">
            <TrustScoreBadge trustScore={landlordTrustScore} showDetails />
          </div>
          {listing.agentActive && (
            <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <AgentActivityIndicator active={listing.agentActive} size="sm" label="AI Active" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center p-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="backdrop-blur-md bg-background/80"
              onClick={onView}
              data-testid={`button-view-${listing.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="backdrop-blur-md bg-background/80"
              onClick={onMessage}
              data-testid={`button-message-${listing.id}`}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="backdrop-blur-md bg-background/80"
              onClick={onSave}
              data-testid={`button-save-${listing.id}`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate" data-testid={`text-title-${listing.id}`}>
                {listing.title}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{listing.city}, {listing.state || listing.country}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold tabular-nums" data-testid={`text-price-${listing.id}`}>
                ${listing.price.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{listing.bedrooms} bed</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{listing.bathrooms} bath</span>
            </div>
            {listing.squareFeet && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{listing.squareFeet} sq ft</span>
              </div>
            )}
          </div>

          {listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {listing.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.amenities.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {landlordName && (
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Listed by {landlordName}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
