import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, MessageSquare, DollarSign, User, Trash2, ExternalLink, Building2, Shield, FileCheck, AlertTriangle, Home, Calendar, MapPin, Star, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

const demoSavedListings = [
  {
    id: 1,
    userId: "demo_user",
    listingId: "internal_3",
    title: "Private Room in Mission District",
    price: 1450,
    address: "24th Street",
    notes: "Great location near BART, love the natural light!",
    savedAt: "2024-11-10T10:30:00Z",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
  },
  {
    id: 2,
    userId: "demo_user",
    listingId: "zillow_5",
    title: "Private Room in Noe Valley",
    price: 1650,
    address: "Church Street",
    notes: "Close to cafes and parks. Roommates seem friendly.",
    savedAt: "2024-11-12T14:20:00Z",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"
  },
  {
    id: 3,
    userId: "demo_user",
    listingId: "apartments_8",
    title: "Private Room in Hayes Valley",
    price: 1550,
    address: "Hayes Street",
    notes: "Perfect for my budget, touring this weekend!",
    savedAt: "2024-11-13T16:45:00Z",
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400"
  },
  {
    id: 4,
    userId: "demo_user",
    listingId: "internal_12",
    title: "Private Room in Castro",
    price: 1500,
    address: "Castro Street",
    notes: "Inclusive community, great transit access",
    savedAt: "2024-11-14T09:15:00Z",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400"
  }
];

const demoMatches = [
  {
    listing: {
      id: "internal_7",
      title: "Private Room in Sunset District",
      price: 1300,
      address: "Irving Street",
      bedrooms: 1,
      bathrooms: 0.5,
      imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"
    },
    score: 95,
    reasons: [
      "Within your budget of $1,000-$1,800",
      "Located in preferred neighborhood",
      "Available on your move-in date (Dec 1)",
      "Great reviews from previous tenants"
    ]
  },
  {
    listing: {
      id: "zillow_12",
      title: "Private Room in Inner Richmond",
      price: 1350,
      address: "Geary Boulevard",
      bedrooms: 1,
      bathrooms: 0.5,
      imageUrl: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400"
    },
    score: 88,
    reasons: [
      "Excellent price for the area",
      "Close to Golden Gate Park",
      "Pet-friendly (you mentioned a cat)",
      "In-unit laundry"
    ]
  },
  {
    listing: {
      id: "apartments_14",
      title: "Private Room in Potrero Hill",
      price: 1550,
      address: "18th Street",
      bedrooms: 1,
      bathrooms: 1,
      imageUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400"
    },
    score: 82,
    reasons: [
      "Private bathroom included",
      "Quiet professional household",
      "Near tech shuttle stops",
      "Recently renovated"
    ]
  }
];

const demoChats = [
  {
    id: "chat-1",
    listingId: "internal_3",
    listingTitle: "Private Room in Mission District",
    landlordName: "Sarah Chen",
    lastMessage: "The room is still available! When would you like to schedule a viewing?",
    lastMessageTime: "2024-11-14T14:30:00Z",
    unreadCount: 2,
    messages: [
      { id: "1", sender: "user", text: "Hi! I'm interested in the room on 24th Street. Is it still available?", timestamp: "2024-11-14T10:00:00Z" },
      { id: "2", sender: "landlord", text: "Hi there! Yes, the room is still available. Would you like to schedule a viewing?", timestamp: "2024-11-14T10:15:00Z" },
      { id: "3", sender: "user", text: "That would be great! I'm available this weekend. What times work for you?", timestamp: "2024-11-14T14:00:00Z" },
      { id: "4", sender: "landlord", text: "The room is still available! When would you like to schedule a viewing?", timestamp: "2024-11-14T14:30:00Z" }
    ]
  },
  {
    id: "chat-2",
    listingId: "zillow_5",
    listingTitle: "Private Room in Noe Valley",
    landlordName: "Michael Rodriguez",
    lastMessage: "We have an application form I can send you if you're interested",
    lastMessageTime: "2024-11-13T16:20:00Z",
    unreadCount: 0,
    messages: [
      { id: "1", sender: "user", text: "Hello! I saw your listing in Noe Valley. Can you tell me more about the roommates?", timestamp: "2024-11-13T15:00:00Z" },
      { id: "2", sender: "landlord", text: "Hi! We're two working professionals in our late 20s. One works in tech, the other in healthcare. Pretty quiet household.", timestamp: "2024-11-13T15:30:00Z" },
      { id: "3", sender: "user", text: "That sounds perfect! I'm also a working professional. What's the next step?", timestamp: "2024-11-13T16:00:00Z" },
      { id: "4", sender: "landlord", text: "We have an application form I can send you if you're interested", timestamp: "2024-11-13T16:20:00Z" }
    ]
  },
  {
    id: "chat-3",
    listingId: "apartments_8",
    listingTitle: "Private Room in Hayes Valley",
    landlordName: "Jessica Park",
    lastMessage: "Thanks for your interest! Let me know if you have other questions.",
    lastMessageTime: "2024-11-12T11:45:00Z",
    unreadCount: 0,
    messages: [
      { id: "1", sender: "user", text: "Hi! Are utilities included in the rent?", timestamp: "2024-11-12T10:00:00Z" },
      { id: "2", sender: "landlord", text: "Internet and water are included. PG&E is split between roommates, usually around $40-60/month per person.", timestamp: "2024-11-12T11:00:00Z" },
      { id: "3", sender: "user", text: "Perfect, thank you for clarifying!", timestamp: "2024-11-12T11:30:00Z" },
      { id: "4", sender: "landlord", text: "Thanks for your interest! Let me know if you have other questions.", timestamp: "2024-11-12T11:45:00Z" }
    ]
  }
];

const demoEscrows: EscrowRecord[] = [
  {
    id: "escrow-1",
    listingId: "internal_3",
    tenantEmail: "demo_user@livva.com",
    amount: 1450,
    currency: "usd",
    status: "funded",
    channel: "locus",
    createdAt: "2024-11-14T15:00:00Z"
  },
  {
    id: "escrow-2",
    listingId: "zillow_5",
    tenantEmail: "demo_user@livva.com",
    amount: 1650,
    currency: "usd",
    status: "pending",
    channel: "locus",
    createdAt: "2024-11-13T10:00:00Z"
  },
  {
    id: "escrow-3",
    listingId: "internal_7",
    tenantEmail: "demo_user@livva.com",
    amount: 1300,
    currency: "usd",
    status: "released",
    channel: "stripe",
    createdAt: "2024-10-15T12:00:00Z"
  }
];

const demoVerifications = [
  {
    id: "verify-1",
    listingId: "internal_3",
    listingTitle: "Private Room in Mission District",
    status: "pending_landlord",
    createdAt: "2024-11-14T15:30:00Z",
    moveInDate: "2024-12-01",
    checklist: [
      { item: "Property condition photos submitted", completed: true },
      { item: "Move-in checklist signed by tenant", completed: true },
      { item: "Key handoff scheduled", completed: false },
      { item: "Landlord final approval", completed: false }
    ],
    notes: "Awaiting landlord's final approval to release escrow"
  },
  {
    id: "verify-2",
    listingId: "zillow_5",
    listingTitle: "Private Room in Noe Valley",
    status: "completed",
    createdAt: "2024-11-10T09:00:00Z",
    moveInDate: "2024-11-15",
    completedAt: "2024-11-15T14:00:00Z",
    checklist: [
      { item: "Property condition photos submitted", completed: true },
      { item: "Move-in checklist signed by tenant", completed: true },
      { item: "Key handoff completed", completed: true },
      { item: "Landlord final approval", completed: true }
    ],
    notes: "Successfully verified. Escrow released to landlord."
  }
];

const demoPenalties = [
  {
    id: "penalty-1",
    listingId: "internal_7",
    listingTitle: "Private Room in Sunset District",
    type: "property_damage",
    description: "Minor wall damage from furniture - under dispute",
    amount: 150,
    currency: "usd",
    status: "disputed",
    createdAt: "2024-10-20T10:00:00Z",
    disputeReason: "Damage was pre-existing, included in move-in photos",
    resolution: null
  },
  {
    id: "penalty-2",
    listingId: "apartments_8",
    listingTitle: "Private Room in Hayes Valley",
    type: "late_payment",
    description: "Late rent payment - resolved with grace period",
    amount: 50,
    currency: "usd",
    status: "resolved",
    createdAt: "2024-09-05T08:00:00Z",
    resolvedAt: "2024-09-06T16:00:00Z",
    resolution: "Waived due to bank processing delay"
  }
];

const demoRentPayments = [
  {
    id: "rent-1",
    listingId: "internal_3",
    listingTitle: "Private Room in Mission District",
    landlordEmail: "landlord1@livva.com",
    landlordName: "Sarah Chen",
    amount: 1450,
    currency: "usd",
    status: "paid",
    paidAt: "2024-11-01T09:00:00Z",
    dueDate: "2024-11-01",
    period: "November 2024"
  },
  {
    id: "rent-2",
    listingId: "internal_3",
    listingTitle: "Private Room in Mission District",
    landlordEmail: "landlord1@livva.com",
    landlordName: "Sarah Chen",
    amount: 1450,
    currency: "usd",
    status: "paid",
    paidAt: "2024-10-01T10:30:00Z",
    dueDate: "2024-10-01",
    period: "October 2024"
  },
  {
    id: "rent-3",
    listingId: "zillow_5",
    listingTitle: "Private Room in Noe Valley",
    landlordEmail: "landlord2@livva.com",
    landlordName: "Michael Rodriguez",
    amount: 1650,
    currency: "usd",
    status: "upcoming",
    dueDate: "2024-12-01",
    period: "December 2024"
  }
];

const menuItems = [
  { id: "saved", icon: Heart, label: "Saved Listings", href: "/portal?tab=saved" },
  { id: "matches", icon: Building2, label: "AI Matches", href: "/portal?tab=matches" },
  { id: "chats", icon: MessageSquare, label: "Chats", href: "/portal?tab=chats" },
  { id: "finances", icon: DollarSign, label: "Finances", href: "/portal?tab=finances" },
  { id: "trust", icon: Shield, label: "Trust Score", href: "/portal?tab=trust" },
  { id: "verification", icon: FileCheck, label: "Move-In Verify", href: "/portal?tab=verification" },
  { id: "penalties", icon: AlertTriangle, label: "Penalties", href: "/portal?tab=penalties" },
  { id: "payments", icon: DollarSign, label: "Pay Rent", href: "/portal?tab=payments" },
  { id: "locus", icon: DollarSign, label: "Locus Agent", href: "/portal?tab=locus" }
];

export default function Portal() {
  const searchString = useSearch();
  const [userId] = useState("demo_user");
  const [userEmail] = useState("demo_user@livva.com");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [locusPrompt, setLocusPrompt] = useState("");
  const [locusResponse, setLocusResponse] = useState("");
  const [locusLoading, setLocusLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [selectedListingTitle, setSelectedListingTitle] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { toast} = useToast();

  const urlParams = new URLSearchParams(searchString);
  const activeTab = urlParams.get('tab') || 'saved';

  const { data: fetchedSaved = [], isLoading: loadingSaved } = useQuery<SavedListing[]>({
    queryKey: ["/api/saved", userId],
    enabled: !!userId,
  });

  const { data: fetchedEscrows = [], isLoading: loadingEscrows } = useQuery<EscrowRecord[]>({
    queryKey: ["/api/escrow", userId],
    enabled: !!userId,
  });

  const { data: fetchedMatches = [], isLoading: loadingMatches } = useQuery<MatchResult[]>({
    queryKey: ["/api/matches", userId],
    enabled: !!userId,
  });

  const { data: fetchedPayments = [], isLoading: loadingPayments } = useQuery<typeof demoRentPayments>({
    queryKey: ["/api/rent/payments", userEmail],
    enabled: !!userEmail,
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

  const savedListings = fetchedSaved.length > 0 ? fetchedSaved : demoSavedListings;
  const escrows = fetchedEscrows.length > 0 ? fetchedEscrows : demoEscrows;
  const matches = fetchedMatches.length > 0 ? fetchedMatches : demoMatches;
  const rentPayments = fetchedPayments.length > 0 ? fetchedPayments : demoRentPayments;

  const handleLocusPrompt = async () => {
    if (!locusPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt for the Locus agent",
        variant: "destructive",
      });
      return;
    }

    setLocusLoading(true);
    setLocusResponse("");

    try {
      const response = await fetch("/api/locus/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: locusPrompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute Locus agent");
      }

      const data = await response.json();
      setLocusResponse(data.response || "Agent executed successfully");
      toast({
        title: "Success",
        description: "Locus agent executed your request",
      });
    } catch (error) {
      console.error("Locus agent error:", error);
      setLocusResponse("Error: " + (error instanceof Error ? error.message : "Unknown error"));
      toast({
        title: "Error",
        description: "Failed to execute Locus agent",
        variant: "destructive",
      });
    } finally {
      setLocusLoading(false);
    }
  };

  const handleRentPayment = async () => {
    if (!selectedListingId || !paymentAmount) {
      toast({
        title: "Missing information",
        description: "Please select a rental and enter payment amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setPaymentProcessing(true);

    // get landlord details from selected payment
    const selectedPayment = rentPayments.find(r => r.listingId === selectedListingId && r.status === 'upcoming');

    try {
      const response = await fetch("/api/rent/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListingId,
          listingTitle: selectedListingTitle,
          amount,
          currency: "usd",
          tenantEmail: userEmail,
          landlordName: selectedPayment?.landlordName || "Landlord",
          landlordEmail: selectedPayment?.landlordEmail,
          period: selectedPayment?.period || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment");
      }

      const data = await response.json();
      
      // invalidate payment history cache
      queryClient.invalidateQueries({ queryKey: ["/api/rent/payments", userEmail] });

      toast({
        title: "Payment successful!",
        description: `Your rent payment of $${amount.toFixed(2)} has been processed. Your trust score has been improved!`,
      });

      setPaymentAmount("");
      setSelectedListingId("");
      setSelectedListingTitle("");
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  const renderContent = () => {
    switch (activeTab) {
      case "saved":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Saved Listings</h2>
              <p className="text-muted-foreground">Properties you've bookmarked for later</p>
            </div>
            
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
              <div className="grid gap-4">
                {savedListings.map((item: any) => (
                  <Card key={item.id} className="hover-elevate" data-testid={`card-saved-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <div className="w-32 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img src={item.imageUrl} alt={item.title || 'Listing'} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Link href={`/listing/${item.listingId}`}>
                                <h3 className="font-semibold hover:text-primary mb-1" data-testid={`text-listing-title-${item.id}`}>
                                  {item.title || `Listing #${item.listingId}`}
                                </h3>
                              </Link>
                              {item.price && item.address && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    ${item.price}/mo
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.address}
                                  </span>
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mb-2 italic">"{item.notes}"</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Saved {new Date(item.savedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/listing/${item.listingId}`}>
                                <Button variant="outline" size="sm" data-testid={`button-view-saved-${item.id}`}>
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteSavedMutation.mutate(item.listingId)}
                                disabled={deleteSavedMutation.isPending}
                                data-testid={`button-unsave-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "matches":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">AI-Powered Matches</h2>
              <p className="text-muted-foreground">Listings matched to your preferences using our Match Agent</p>
            </div>
            
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
              <div className="grid gap-4">
                {matches.map((match, idx) => (
                  <Card key={idx} className="hover-elevate" data-testid={`card-match-${idx}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {match.listing.imageUrl && (
                          <div className="w-32 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img src={match.listing.imageUrl} alt={match.listing.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="default" className="bg-primary" data-testid={`badge-score-${idx}`}>
                                  <Star className="h-3 w-3 mr-1" />
                                  {match.score}% Match
                                </Badge>
                                <Link href={`/listing/${match.listing.id}`}>
                                  <h3 className="font-semibold hover:text-primary" data-testid={`text-match-title-${idx}`}>{match.listing.title}</h3>
                                </Link>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${match.listing.price}/mo
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.listing.address}
                                </span>
                              </div>
                            </div>
                            <Link href={`/listing/${match.listing.id}`}>
                              <Button size="sm" data-testid={`button-view-match-${idx}`}>
                                View Listing
                              </Button>
                            </Link>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Why this matches:</p>
                            {match.reasons.map((reason, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground">{reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "chats":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Chat Logs</h2>
              <p className="text-muted-foreground">Your conversations with landlords</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conversations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      {demoChats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`p-3 border-b cursor-pointer hover-elevate ${selectedChat === chat.id ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedChat(chat.id)}
                          data-testid={`chat-item-${chat.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-sm">{chat.landlordName}</p>
                            {chat.unreadCount > 0 && (
                              <Badge variant="default" className="h-5 px-1.5" data-testid={`badge-unread-${chat.id}`}>
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{chat.listingTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              <div className="col-span-2">
                {selectedChat ? (
                  <Card className="h-full">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base" data-testid={`text-chat-landlord-${selectedChat}`}>
                            {demoChats.find(c => c.id === selectedChat)?.landlordName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {demoChats.find(c => c.id === selectedChat)?.listingTitle}
                          </CardDescription>
                        </div>
                        <Link href={`/listing/${demoChats.find(c => c.id === selectedChat)?.listingId}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-listing-${selectedChat}`}>
                            View Listing
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ScrollArea className="h-[350px] mb-4">
                        <div className="space-y-3">
                          {demoChats.find(c => c.id === selectedChat)?.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              data-testid={`message-${msg.id}`}
                            >
                              <div className={`max-w-[80%] p-3 rounded-lg ${
                                msg.sender === 'user' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs mt-1 ${
                                  msg.sender === 'user' 
                                    ? 'text-primary-foreground/70' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          data-testid="input-message"
                        />
                        <Button size="icon" data-testid="button-send-message">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Select a conversation to view messages</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );

      case "finances":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Finances & Escrows</h2>
              <p className="text-muted-foreground">Track your deposits and payment status</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Escrowed</p>
                      <p className="text-2xl font-bold" data-testid="text-total-escrowed">
                        ${escrows.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Escrows</p>
                      <p className="text-2xl font-bold" data-testid="text-active-escrows">
                        {escrows.filter(e => e.status === 'funded' || e.status === 'pending').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold" data-testid="text-completed-escrows">
                        {escrows.filter(e => e.status === 'released').length}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
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
              <div className="grid gap-4">
                {escrows.map((escrow) => (
                  <Card key={escrow.id} className="hover-elevate" data-testid={`card-escrow-${escrow.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                escrow.status === "funded" ? "default" :
                                escrow.status === "pending" ? "outline" :
                                "secondary"
                              }
                              data-testid={`badge-status-${escrow.id}`}
                            >
                              {escrow.status === "funded" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {escrow.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                              {escrow.status.toUpperCase()}
                            </Badge>
                            <span className="text-lg font-bold" data-testid={`text-amount-${escrow.id}`}>
                              ${escrow.amount} {escrow.currency.toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              Listing: {escrow.listingId}
                            </p>
                            <p className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              Channel: {escrow.channel.toUpperCase()}
                            </p>
                            <p className="text-xs">
                              Created {new Date(escrow.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/listing/${escrow.listingId}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-listing-${escrow.id}`}>
                              View Listing
                            </Button>
                          </Link>
                          {escrow.status === "funded" && (
                            <Button variant="secondary" size="sm" data-testid={`button-release-${escrow.id}`}>
                              Request Release
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "trust":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Trust Score</h2>
              <p className="text-muted-foreground">Your reputation and verification status</p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Your Trust Score</p>
                    <p className="text-5xl font-bold" data-testid="text-trust-score">
                      85
                      <span className="text-2xl text-muted-foreground">/100</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Good standing</p>
                  </div>
                  <Shield className="h-20 w-20 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-medium" data-testid="text-email-verified">Email Verified</p>
                  </div>
                  <p className="text-sm text-muted-foreground">demo_user@livva.com</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-medium" data-testid="text-phone-verified">Phone Verified</p>
                  </div>
                  <p className="text-sm text-muted-foreground">(415) ***-**89</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <p className="font-medium" data-testid="text-id-pending">ID Pending</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-1" data-testid="button-upload-id">
                    Upload ID
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid="activity-email-verified">
                    <div>
                      <p className="font-medium text-sm">Email Verified</p>
                      <p className="text-xs text-muted-foreground">First verification completed</p>
                    </div>
                    <Badge variant="default">+10</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid="activity-profile-completed">
                    <div>
                      <p className="font-medium text-sm">Profile Completed</p>
                      <p className="text-xs text-muted-foreground">Added profile information</p>
                    </div>
                    <Badge variant="default">+5</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid="activity-phone-verified">
                    <div>
                      <p className="font-medium text-sm">Phone Verified</p>
                      <p className="text-xs text-muted-foreground">Successfully verified phone number</p>
                    </div>
                    <Badge variant="default">+15</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Move-In Verification</h2>
              <p className="text-muted-foreground">Document verification for deposit releases</p>
            </div>
            
            {demoVerifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No verification cases yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verification cases are created when landlords approve your deposit
                  </p>
                  <Link href="/agents">
                    <Button data-testid="button-try-agents-verification">
                      Try Agent Demo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {demoVerifications.map((verification) => (
                  <Card key={verification.id} className="hover-elevate" data-testid={`card-verification-${verification.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                verification.status === "completed" ? "default" :
                                verification.status === "pending_landlord" ? "outline" :
                                "secondary"
                              }
                              data-testid={`badge-verification-status-${verification.id}`}
                            >
                              {verification.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {verification.status === "pending_landlord" && <Clock className="h-3 w-3 mr-1" />}
                              {verification.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <CardTitle className="text-base">{verification.listingTitle}</CardTitle>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Move-in: {new Date(verification.moveInDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Created {new Date(verification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Link href={`/listing/${verification.listingId}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-listing-${verification.id}`}>
                            View Listing
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Verification Checklist:</p>
                          <div className="space-y-2">
                            {verification.checklist.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2" data-testid={`checklist-item-${verification.id}-${idx}`}>
                                {item.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={`text-sm ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {item.item}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {verification.notes && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground italic">{verification.notes}</p>
                          </div>
                        )}
                        {verification.status === "completed" && verification.completedAt && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Completed on {new Date(verification.completedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "penalties":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Penalties & Disputes</h2>
              <p className="text-muted-foreground">Track penalty cases, disputes, and resolutions</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cases</p>
                      <p className="text-2xl font-bold" data-testid="text-total-penalties">
                        {demoPenalties.length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Disputes</p>
                      <p className="text-2xl font-bold" data-testid="text-active-disputes">
                        {demoPenalties.filter(p => p.status === 'disputed').length}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold" data-testid="text-resolved-penalties">
                        {demoPenalties.filter(p => p.status === 'resolved').length}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {demoPenalties.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium mb-2">No penalties</p>
                  <p className="text-sm text-muted-foreground">
                    You have a clean record with no active penalty cases
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {demoPenalties.map((penalty) => (
                  <Card key={penalty.id} className="hover-elevate" data-testid={`card-penalty-${penalty.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                penalty.status === "resolved" ? "default" :
                                penalty.status === "disputed" ? "outline" :
                                "secondary"
                              }
                              data-testid={`badge-penalty-status-${penalty.id}`}
                            >
                              {penalty.status === "resolved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {penalty.status === "disputed" && <AlertCircle className="h-3 w-3 mr-1" />}
                              {penalty.status.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary">
                              {penalty.type.replace("_", " ").toUpperCase()}
                            </Badge>
                            <CardTitle className="text-base">{penalty.listingTitle}</CardTitle>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${penalty.amount} {penalty.currency.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Created {new Date(penalty.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{penalty.description}</p>
                        </div>
                        <Link href={`/listing/${penalty.listingId}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-listing-${penalty.id}`}>
                            View Listing
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {penalty.status === "disputed" && penalty.disputeReason && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Dispute Reason:</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{penalty.disputeReason}</p>
                          </div>
                        )}
                        {penalty.status === "resolved" && penalty.resolution && (
                          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">Resolution:</p>
                            <p className="text-sm text-green-800 dark:text-green-200">{penalty.resolution}</p>
                            {penalty.resolvedAt && (
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Resolved on {new Date(penalty.resolvedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                        {penalty.status === "disputed" && (
                          <div className="flex gap-2">
                            <Button variant="default" size="sm" data-testid={`button-add-evidence-${penalty.id}`}>
                              <FileCheck className="h-4 w-4 mr-1" />
                              Add Evidence
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-contact-support-${penalty.id}`}>
                              Contact Support
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "payments":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Pay Rent with Stripe</h2>
              <p className="text-muted-foreground">Pay your rent securely and improve your trust score</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Make a Payment</CardTitle>
                  <CardDescription>Pay rent to your landlord via Stripe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Rental</label>
                    <select
                      value={selectedListingId}
                      onChange={(e) => {
                        const listingId = e.target.value;
                        setSelectedListingId(listingId);
                        const selected = rentPayments.find(r => r.listingId === listingId && r.status === 'upcoming');
                        if (selected) {
                          setSelectedListingTitle(selected.listingTitle);
                          setPaymentAmount(selected.amount.toString());
                        }
                      }}
                      className="w-full p-2 border rounded-md bg-background"
                      data-testid="select-rental"
                    >
                      <option value="">Choose a rental...</option>
                      {rentPayments.filter(r => r.status === 'upcoming').map((rent) => (
                        <option key={rent.id} value={rent.listingId}>
                          {rent.listingTitle} - {rent.period} (${rent.amount})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (USD)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      disabled={paymentProcessing}
                      data-testid="input-payment-amount"
                    />
                  </div>

                  <Button
                    onClick={handleRentPayment}
                    disabled={paymentProcessing || !selectedListingId || !paymentAmount}
                    className="w-full"
                    data-testid="button-pay-rent"
                  >
                    {paymentProcessing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pay ${paymentAmount || '0.00'}
                      </>
                    )}
                  </Button>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Secure payment processing by Stripe. Successful payments improve your trust score!
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Your past rent payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {rentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="p-3 border rounded-lg hover-elevate"
                          data-testid={`payment-history-${payment.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{payment.listingTitle}</p>
                              <p className="text-xs text-muted-foreground">{payment.period}</p>
                            </div>
                            <Badge
                              variant={payment.status === 'paid' ? 'default' : 'outline'}
                              data-testid={`badge-payment-status-${payment.id}`}
                            >
                              {payment.status === 'paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {payment.status === 'upcoming' && <Clock className="h-3 w-3 mr-1" />}
                              {payment.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {payment.landlordName}
                            </span>
                            <span className="font-semibold">${payment.amount}</span>
                          </div>
                          {payment.paidAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Paid on {new Date(payment.paidAt).toLocaleDateString()}
                            </p>
                          )}
                          {payment.status === 'upcoming' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trust Score Benefits</CardTitle>
                <CardDescription>How rent payments improve your trust score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">On-time payments: +10 points</p>
                    <p className="text-xs">Pay your rent before the due date to earn trust score points</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Payment history: Build reputation</p>
                    <p className="text-xs">Consistent payment history shows reliability to future landlords</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Verified transactions: Security</p>
                    <p className="text-xs">Stripe-verified payments provide proof of payment for both parties</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "locus":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Locus Agent Programming</h2>
              <p className="text-muted-foreground">Interact with the Locus MCP agent using natural language</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Natural Language Interface</CardTitle>
                <CardDescription>
                  Send natural language prompts to the Locus agent to execute payment operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent Prompt</label>
                  <Input
                    placeholder="e.g., Send $1500 deposit to demo@example.com for listing internal_3"
                    value={locusPrompt}
                    onChange={(e) => setLocusPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleLocusPrompt();
                      }
                    }}
                    disabled={locusLoading}
                    data-testid="input-locus-prompt"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example prompts: "Send deposit", "Get payment context", "Check payment status"
                  </p>
                </div>

                <Button
                  onClick={handleLocusPrompt}
                  disabled={locusLoading || !locusPrompt.trim()}
                  className="w-full"
                  data-testid="button-execute-locus"
                >
                  {locusLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Execute Prompt
                    </>
                  )}
                </Button>

                {locusResponse && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Agent Response:</p>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-locus-response">
                      {locusResponse}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Prompts</CardTitle>
                <CardDescription>Common Locus agent operations you can trigger</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setLocusPrompt("Send $1450 deposit to landlord@example.com for listing internal_3")}
                    data-testid="button-example-send-deposit"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Send deposit payment
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setLocusPrompt("Get payment context for user demo_user@livva.com")}
                    data-testid="button-example-get-context"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Get payment context
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setLocusPrompt("Send payment notification to contact demo@example.com")}
                    data-testid="button-example-send-notification"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send payment notification
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Locus MCP Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The Locus agent uses the official @locus-technologies/langchain-mcp-m2m library with LangGraph's React agent pattern.
                </p>
                <p>
                  It leverages Claude 3.5 Sonnet (ChatAnthropic) to interpret natural language prompts and execute payment operations through Locus MCP tools:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">send_to_email</code> - Create deposit escrows</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">get_payment_context</code> - Retrieve payment information</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">send_to_contact</code> - Send payment notifications</li>
                </ul>
                <p>
                  Authentication uses OAuth Client Credentials flow with secure environment variable management.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <Home className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Livva</span>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>My Portal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild isActive={activeTab === item.id}>
                        <a href={item.href} data-testid={`sidebar-${item.id}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold" data-testid="text-user-name">Demo User</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-email">demo_user@livva.com</p>
                </div>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
