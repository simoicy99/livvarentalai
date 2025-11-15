import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, MessageSquare, TrendingUp, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AgentActivityIndicator } from "@/components/agent-activity-indicator";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing, Match, Message, AgentActivity } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const isLandlord = user?.userType === "landlord" || user?.userType === "both";

  const { data: stats, isLoading: statsLoading } = useQuery<{
    listingsCount?: number;
    matchesCount?: number;
    messagesCount?: number;
    activeListings?: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<AgentActivity[]>({
    queryKey: ["/api/agent-activities"],
    enabled: !!user,
  });

  const { data: recentListings } = useQuery<Listing[]>({
    queryKey: ["/api/listings/recent"],
    enabled: isLandlord,
  });

  const { data: recentMatches } = useQuery<Match[]>({
    queryKey: ["/api/matches/recent"],
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
            Welcome back, {user?.firstName || "there"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your {isLandlord ? "listings" : "rental search"}
          </p>
        </div>
        {isLandlord && (
          <Link href="/listings/new">
            <Button data-testid="button-create-listing-header">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isLandlord ? "Active Listings" : "Saved Properties"}
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-listings">
                    {stats?.activeListings || stats?.listingsCount || 0}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-matches">
                    {stats?.matchesCount || 0}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-messages">
                    {stats?.messagesCount || 0}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Agent Status</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <AgentActivityIndicator active={true} label="Active" />
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Agent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex gap-3 items-start" data-testid={`activity-${activity.id}`}>
                    <div className="p-2 bg-primary/10 rounded-full">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity. Your AI agent will start working once you {isLandlord ? "create a listing" : "save properties"}.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {isLandlord ? "Recent Listings" : "Recent Matches"}
            </CardTitle>
            <Link href={isLandlord ? "/listings" : "/matches"}>
              <Button variant="ghost" size="sm" data-testid="button-view-all">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLandlord ? (
              recentListings && recentListings.length > 0 ? (
                <div className="space-y-3">
                  {recentListings.slice(0, 3).map((listing) => (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2" data-testid={`listing-item-${listing.id}`}>
                        <div className="h-12 w-12 bg-muted rounded-md flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">${listing.price}/mo</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No listings yet. Create your first listing to get started.
                </p>
              )
            ) : (
              recentMatches && recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {recentMatches.slice(0, 3).map((match) => (
                    <div key={match.id} className="flex items-center gap-3 p-3 rounded-lg hover-elevate" data-testid={`match-item-${match.id}`}>
                      <div className="h-12 w-12 bg-muted rounded-md flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Match Score: {Math.round(match.matchScore)}%</p>
                        <p className="text-xs text-muted-foreground capitalize">{match.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No matches yet. Update your preferences to find rentals.
                </p>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
