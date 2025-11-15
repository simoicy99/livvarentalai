import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { EscrowRecord } from "../../../shared/types";

interface EscrowPanelProps {
  tenantEmail: string;
}

const STATUS_VARIANTS = {
  pending: "bg-muted text-muted-foreground",
  funded: "bg-primary/10 text-primary",
  released: "bg-green-500/10 text-green-700 dark:text-green-400",
  refunded: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  failed: "bg-destructive/10 text-destructive",
} as const;

const CHANNEL_LABELS = {
  locus: "Locus",
  stripe: "Stripe",
} as const;

export function EscrowPanel({ tenantEmail }: EscrowPanelProps) {
  const { toast } = useToast();

  const { data: escrowsData, isLoading } = useQuery<{ escrows: EscrowRecord[] }>({
    queryKey: ["/api/escrow", tenantEmail],
    queryFn: async () => {
      const response = await fetch(`/api/escrow?tenantEmail=${encodeURIComponent(tenantEmail)}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch escrows");
      }
      return response.json();
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (escrowId: string) => {
      const response = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ escrowId }),
      });
      if (!response.ok) {
        throw new Error("Failed to release escrow");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Escrow released",
        description: "The deposit has been released successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/escrow", tenantEmail] });
    },
    onError: (error: Error) => {
      toast({
        title: "Release failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="escrow-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Deposit Escrows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading escrows...</p>
        </CardContent>
      </Card>
    );
  }

  const escrows = escrowsData?.escrows || [];

  if (escrows.length === 0) {
    return (
      <Card data-testid="escrow-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Deposit Escrows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No escrows yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="escrow-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Deposit Escrows
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {escrows.map((escrow, index) => (
            <div
              key={escrow.id}
              className="flex items-start justify-between gap-3 p-3 rounded-md border"
              data-testid={`escrow-${index}`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" data-testid={`escrow-listing-${index}`}>
                    Listing {escrow.listingId.slice(0, 8)}...
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    data-testid={`escrow-channel-${index}`}
                  >
                    {CHANNEL_LABELS[escrow.channel]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`escrow-amount-${index}`}>
                  ${escrow.amount.toFixed(2)} {escrow.currency.toUpperCase()}
                </p>
                <Badge
                  variant="secondary"
                  className={`text-xs ${STATUS_VARIANTS[escrow.status]}`}
                  data-testid={`escrow-status-${index}`}
                >
                  {escrow.status}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {escrow.status === "funded" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => releaseMutation.mutate(escrow.id)}
                    disabled={releaseMutation.isPending}
                    data-testid={`button-release-${index}`}
                  >
                    Release
                  </Button>
                )}
                {escrow.status === "pending" && escrow.stripeSessionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    data-testid={`button-payment-${index}`}
                  >
                    <a
                      href={`https://checkout.stripe.com/pay/${escrow.stripeSessionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pay <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
