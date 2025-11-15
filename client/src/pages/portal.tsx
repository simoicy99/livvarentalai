import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Heart, DollarSign, User, Trash2, ExternalLink, Building2, Shield, FileCheck, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

type SavedListing = {
  id: number;
  userId: string;
  listingId: string;
  notes?: string;
  savedAt: string;
};

type EscrowRecord = {
  id: string;
  listingId: string;
  tenantEmail: string;
  amount: number;
  currency: string;
  status: string;
  channel: string;
  createdAt: string;
};

type MatchResult = {
  listing: any;
  score: number;
  reasons: string[];
};

type TrustProfile = {
  email: string;
  score: number;
  events: Array<{
    type: string;
    delta: number;
    reason: string;
    timestamp: string;
  }>;
  verifiedIdentity: boolean;
  verifiedPhone: boolean;
  verifiedEmail: boolean;
};

type VerificationCase = {
  escrowId: string;
  listingId: string;
  tenantEmail: string;
  landlordEmail: string;
  tenantUploads: number;
  landlordUploads: number;
  hasDispute: boolean;
  status: string;
};

type Penalty = {
  id: string;
  eventType: string;
  fromEmail: string;
  toEmail: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  timestamp: string;
};

export default function Portal() {
  const [userId] = useState("demo_user");
  const [userEmail] = useState("demo_user@livva.com");
  const { toast } = useToast();

  const { data: savedListings = [], isLoading: loadingSaved } = useQuery<SavedListing[]>({
    queryKey: ["/api/saved", userId],
    enabled: !!userId,
  });

  const { data: escrows = [], isLoading: loadingEscrows } = useQuery<EscrowRecord[]>({
    queryKey: ["/api/escrow", userId],
    enabled: !!userId,
  });

  const { data: matches = [], isLoading: loadingMatches } = useQuery<MatchResult[]>({
    queryKey: ["/api/matches", userId],
    enabled: !!userId,
  });

  const { data: trustProfile, isLoading: loadingTrust } = useQuery<TrustProfile>({
    queryKey: ["/api/trust", userEmail],
    enabled: !!userEmail,
  });

  const { data: verificationCases = [], isLoading: loadingVerifications } = useQuery<VerificationCase[]>({
    queryKey: ["/api/verification"],
  });

  const { data: penalties = [], isLoading: loadingPenalties } = useQuery<Penalty[]>({
    queryKey: ["/api/penalties"],
    queryFn: () => fetch(`/api/penalties?email=${userEmail}`).then(r => r.json()),
  });

  const deleteSavedMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await fetch(`/api/saved/${listingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved", userId] });
      toast({
        title: "Removed from saved",
        description: "Listing removed from your saved items",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">My Portal</h1>
            <p className="text-muted-foreground">Manage your rental journey</p>
          </div>
        </div>

        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="saved" data-testid="tab-saved">
              <Heart className="h-4 w-4 mr-2" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="matches" data-testid="tab-matches">
              <Building2 className="h-4 w-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="chats" data-testid="tab-chats">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="finances" data-testid="tab-finances">
              <DollarSign className="h-4 w-4 mr-2" />
              Finances
            </TabsTrigger>
            <TabsTrigger value="trust" data-testid="tab-trust">
              <Shield className="h-4 w-4 mr-2" />
              Trust
            </TabsTrigger>
            <TabsTrigger value="verification" data-testid="tab-verification">
              <FileCheck className="h-4 w-4 mr-2" />
              Verify
            </TabsTrigger>
            <TabsTrigger value="penalties" data-testid="tab-penalties">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Penalties
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved Listings</CardTitle>
                <CardDescription>
                  Properties you've bookmarked for later
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSaved ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading saved listings...
                  </div>
                ) : savedListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No saved listings yet</p>
                    <Link href="/">
                      <Button data-testid="button-browse-listings">
                        Browse Listings
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {savedListings.map((item) => (
                        <Card key={item.id} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium" data-testid={`text-listing-id-${item.listingId}`}>
                                    Listing #{item.listingId}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {item.notes}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Saved {new Date(item.savedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/listing/${item.listingId}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    data-testid={`button-view-${item.listingId}`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSavedMutation.mutate(item.listingId)}
                                  disabled={deleteSavedMutation.isPending}
                                  data-testid={`button-delete-${item.listingId}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>AI Matches</CardTitle>
                <CardDescription>
                  Properties matched to your preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMatches ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading matches...
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No matches yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Visit the Agents page to get AI-powered recommendations
                    </p>
                    <Link href="/agents">
                      <Button data-testid="button-try-agents">
                        Try Agent Demo
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {matches.map((match, idx) => (
                        <Card key={idx} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="default" data-testid={`badge-score-${idx}`}>
                                    {match.score}% match
                                  </Badge>
                                  <span className="font-medium">{match.listing.title}</span>
                                </div>
                                <div className="space-y-1 mb-3">
                                  {match.reasons.map((reason, i) => (
                                    <p key={i} className="text-sm text-muted-foreground">
                                      • {reason}
                                    </p>
                                  ))}
                                </div>
                              </div>
                              <Link href={`/listing/${match.listing.id}`}>
                                <Button
                                  variant="default"
                                  size="sm"
                                  data-testid={`button-view-match-${idx}`}
                                >
                                  View Listing
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chats">
            <Card>
              <CardHeader>
                <CardTitle>Chat Logs</CardTitle>
                <CardDescription>
                  Your conversations with landlords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the Communication Agent to send messages to landlords
                  </p>
                  <Link href="/agents">
                    <Button data-testid="button-start-chat">
                      Try Agent Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finances">
            <Card>
              <CardHeader>
                <CardTitle>Finances & Escrows</CardTitle>
                <CardDescription>
                  Track your deposits and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEscrows ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading escrows...
                  </div>
                ) : escrows.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No escrows yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create secure deposits through the Payments Agent
                    </p>
                    <Link href="/agents">
                      <Button data-testid="button-create-escrow">
                        Try Agent Demo
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {escrows.map((escrow) => (
                        <Card key={escrow.id} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={
                                      escrow.status === "funded"
                                        ? "default"
                                        : escrow.status === "released"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    data-testid={`badge-status-${escrow.id}`}
                                  >
                                    {escrow.status}
                                  </Badge>
                                  <span className="font-medium" data-testid={`text-amount-${escrow.id}`}>
                                    {escrow.amount} {escrow.currency.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Listing: {escrow.listingId}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Channel: {escrow.channel}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Created {new Date(escrow.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Link href={`/listing/${escrow.listingId}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    data-testid={`button-view-listing-${escrow.id}`}
                                  >
                                    View Listing
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trust">
            <Card>
              <CardHeader>
                <CardTitle>Trust Score</CardTitle>
                <CardDescription>
                  Your reputation and verification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTrust ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading trust profile...
                  </div>
                ) : trustProfile ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Your Trust Score</p>
                        <p className="text-4xl font-bold" data-testid="text-trust-score">
                          {trustProfile.score}
                          <span className="text-xl text-muted-foreground">/100</span>
                        </p>
                      </div>
                      <Shield className="h-16 w-16 text-primary" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-card border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Email</p>
                        </div>
                        <Badge variant={trustProfile.verifiedEmail ? "default" : "outline"}>
                          {trustProfile.verifiedEmail ? "Verified" : "Not Verified"}
                        </Badge>
                      </div>
                      <div className="p-4 bg-card border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Phone</p>
                        </div>
                        <Badge variant={trustProfile.verifiedPhone ? "default" : "outline"}>
                          {trustProfile.verifiedPhone ? "Verified" : "Not Verified"}
                        </Badge>
                      </div>
                      <div className="p-4 bg-card border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Identity</p>
                        </div>
                        <Badge variant={trustProfile.verifiedIdentity ? "default" : "outline"}>
                          {trustProfile.verifiedIdentity ? "Verified" : "Not Verified"}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {trustProfile.events.slice(0, 10).map((event, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{event.type.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-muted-foreground">{event.reason}</p>
                              </div>
                              <Badge variant={event.delta > 0 ? "default" : "destructive"}>
                                {event.delta > 0 ? "+" : ""}{event.delta}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No trust profile found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle>Move-In Verifications</CardTitle>
                <CardDescription>
                  Document verification for deposit releases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVerifications ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading verification cases...
                  </div>
                ) : verificationCases.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No verification cases yet</p>
                    <p className="text-sm text-muted-foreground">
                      Verification cases are created when you create a deposit escrow
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {verificationCases.map((verificationCase) => (
                        <Card key={verificationCase.escrowId} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={verificationCase.status === "approved" ? "default" : "outline"}>
                                    {verificationCase.status}
                                  </Badge>
                                  <span className="font-medium">Escrow {verificationCase.escrowId.slice(0, 8)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Listing: {verificationCase.listingId}
                                </p>
                                <div className="flex gap-4 mt-3">
                                  <div className="flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-primary" />
                                    <span className="text-sm">
                                      Tenant: {verificationCase.tenantUploads} uploads
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-primary" />
                                    <span className="text-sm">
                                      Landlord: {verificationCase.landlordUploads} uploads
                                    </span>
                                  </div>
                                </div>
                                {verificationCase.hasDispute && (
                                  <Badge variant="destructive" className="mt-2">
                                    Dispute Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="penalties">
            <Card>
              <CardHeader>
                <CardTitle>Penalties & Fees</CardTitle>
                <CardDescription>
                  Behavior-based micro-payments and penalties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPenalties ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading penalties...
                  </div>
                ) : penalties.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No penalties recorded</p>
                    <p className="text-sm text-muted-foreground">
                      Great! Keep up the good behavior
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {penalties.map((penalty) => (
                        <Card key={penalty.id} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="destructive">
                                    {penalty.eventType.replace(/_/g, ' ')}
                                  </Badge>
                                  <span className="font-medium">
                                    {penalty.amount} {penalty.currency}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {penalty.reason}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  From: {penalty.fromEmail} → To: {penalty.toEmail}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant={penalty.status === "completed" ? "default" : "outline"}>
                                    {penalty.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(penalty.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
