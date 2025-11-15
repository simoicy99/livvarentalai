import { Shield, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrustScore } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustScoreBadgeProps {
  trustScore?: TrustScore | null;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function TrustScoreBadge({ trustScore, size = "md", showDetails = false }: TrustScoreBadgeProps) {
  if (!trustScore) {
    return (
      <Badge variant="outline" className="gap-1">
        <Shield className="h-3 w-3" />
        <span className="text-xs">Not Verified</span>
      </Badge>
    );
  }

  const score = Math.round(trustScore.score);
  const variant = score >= 80 ? "default" : score >= 50 ? "secondary" : "outline";
  
  const verifications = [
    { label: "ID Verified", verified: trustScore.idVerified },
    { label: "Phone Verified", verified: trustScore.phoneVerified },
    { label: "Email Verified", verified: trustScore.emailVerified },
  ];

  const badge = (
    <Badge variant={variant} className="gap-1">
      <Shield className={`h-${size === "sm" ? 3 : size === "lg" ? 4 : 3.5} w-${size === "sm" ? 3 : size === "lg" ? 4 : 3.5}`} />
      <span className={size === "sm" ? "text-xs" : "text-sm font-semibold"}>{score}%</span>
    </Badge>
  );

  if (!showDetails) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent className="p-4">
        <div className="space-y-2">
          <p className="font-semibold text-sm">Trust Score: {score}%</p>
          <div className="space-y-1">
            {verifications.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                {item.verified ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3" />
                )}
                <span className={item.verified ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {trustScore.rentalHistory} rental{trustScore.rentalHistory !== 1 ? "s" : ""} • {trustScore.positiveReviews} positive review{trustScore.positiveReviews !== 1 ? "s" : ""}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
