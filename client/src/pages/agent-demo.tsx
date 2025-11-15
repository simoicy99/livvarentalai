import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { AgentConsole, type AgentActivity } from "@/components/AgentConsole";
import { EscrowPanel } from "@/components/EscrowPanel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, MapPin, DollarSign } from "lucide-react";
import type { TenantProfile, MatchResult, ConversationMessage } from "../../../shared/types";

// mock tenant for demo
const mockTenant: TenantProfile = {
  id: "tenant_1",
  name: "Alex Johnson",
  email: "alex@example.com",
  budgetMin: 2000,
  budgetMax: 3500,
  preferredCities: ["San Francisco", "Oakland"],
  bedrooms: 2,
  moveInDate: "2025-03-01",
};

export default function AgentDemo() {
  const { toast } = useToast();
  const [tenant, setTenant] = useState<TenantProfile>(mockTenant);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [generatedMessage, setGeneratedMessage] = useState<ConversationMessage | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string>("");

  const addActivity = (activity: AgentActivity) => {
    setActivities(prev => [...prev, activity]);
  };

  const matchMutation = useMutation({
    mutationFn: async () => {
      addActivity({
        agent: "match",
        action: "Analyzing your preferences and scoring listings...",
        status: "in_progress",
        timestamp: new Date().toISOString(),
      });

      return await apiRequest("POST", "/api/match", { tenantProfile: tenant })
        .then(res => res.json());
    },
    onSuccess: (data) => {
      setMatches(data.matches);
      addActivity({
        agent: "match",
        action: `Found ${data.matches.length} listings, ranked by match score`,
        status: "completed",
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Match complete",
        description: `Found ${data.matches.length} matching listings`,
      });
    },
    onError: () => {
      addActivity({
        agent: "match",
        action: "Failed to match listings",
        status: "failed",
        timestamp: new Date().toISOString(),
      });
    },
  });

  const messageMutation = useMutation({
    mutationFn: async (listingId: string) => {
      addActivity({
        agent: "communication",
        action: "Drafting personalized message to landlord...",
        status: "in_progress",
        timestamp: new Date().toISOString(),
      });

      return await apiRequest("POST", "/api/messages", {
        type: "initial",
        tenant,
        listingId,
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.message);
      addActivity({
        agent: "communication",
        action: "Message drafted and ready to send",
        status: "completed",
        timestamp: new Date().toISOString(),
      });
    },
    onError: () => {
      addActivity({
        agent: "communication",
        action: "Failed to generate message",
        status: "failed",
        timestamp: new Date().toISOString(),
      });
    },
  });

  const escrowMutation = useMutation({
    mutationFn: async ({ listingId, amount }: { listingId: string; amount: number }) => {
      addActivity({
        agent: "payments",
        action: "Creating secure deposit escrow...",
        status: "in_progress",
        timestamp: new Date().toISOString(),
      });

      return await apiRequest("POST", "/api/escrow/create", {
        listingId,
        tenantEmail: tenant.email,
        amount,
        currency: "usd",
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      const paymentInfo = data.paymentUrl ? ` Payment URL: ${data.paymentUrl}` : "";
      addActivity({
        agent: "payments",
        action: `Escrow created via ${data.escrow.channel}, amount: $${data.escrow.amount}${paymentInfo}`,
        status: "completed",
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Escrow created",
        description: `Deposit of $${data.escrow.amount} secured via ${data.escrow.channel}`,
      });
      
      // if there's a payment url, optionally open it
      if (data.paymentUrl) {
        console.log("Payment URL:", data.paymentUrl);
      }
    },
    onError: () => {
      addActivity({
        agent: "payments",
        action: "Failed to create escrow",
        status: "failed",
        timestamp: new Date().toISOString(),
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Agent Demo</h1>
              <p className="text-muted-foreground">
                See how AI agents work together to help you find and secure your perfect rental
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Tenant profile */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={tenant.name}
                      onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                      data-testid="input-tenant-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={tenant.email}
                      onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
                      data-testid="input-tenant-email"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="budgetMin">Min Budget</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        value={tenant.budgetMin}
                        onChange={(e) => setTenant({ ...tenant, budgetMin: parseInt(e.target.value) })}
                        data-testid="input-budget-min"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax">Max Budget</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        value={tenant.budgetMax}
                        onChange={(e) => setTenant({ ...tenant, budgetMax: parseInt(e.target.value) })}
                        data-testid="input-budget-max"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={tenant.bedrooms || ""}
                      onChange={(e) => setTenant({ ...tenant, bedrooms: parseInt(e.target.value) })}
                      data-testid="input-bedrooms"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => matchMutation.mutate()}
                    disabled={matchMutation.isPending}
                    data-testid="button-find-matches"
                  >
                    Find Matches
                  </Button>
                </CardContent>
              </Card>

              <AgentConsole activities={activities} />
              <EscrowPanel tenantEmail={tenant.email} />
            </div>

            {/* Right column: Matches and results */}
            <div className="lg:col-span-2 space-y-6">
              {matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Matched Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {matches.slice(0, 5).map((match, index) => (
                        <div
                          key={match.listing.id}
                          className="p-4 rounded-md border hover-elevate"
                          data-testid={`match-${index}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium" data-testid={`match-title-${index}`}>
                                  {match.listing.title}
                                </h3>
                                <Badge variant="secondary" data-testid={`match-score-${index}`}>
                                  {match.score}% match
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.listing.city}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {match.listing.price}/mo
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {match.reasons.map((reason, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedListingId(match.listing.id);
                                  messageMutation.mutate(match.listing.id);
                                }}
                                disabled={messageMutation.isPending}
                                data-testid={`button-contact-${index}`}
                              >
                                Contact
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => escrowMutation.mutate({
                                  listingId: match.listing.id,
                                  amount: match.listing.price,
                                })}
                                disabled={escrowMutation.isPending}
                                data-testid={`button-escrow-${index}`}
                              >
                                Reserve
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {generatedMessage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generated Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-md bg-muted" data-testid="generated-message">
                      <p className="text-sm whitespace-pre-wrap">{generatedMessage.text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This message was automatically generated by the Communication Agent based on your profile and the listing details.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
