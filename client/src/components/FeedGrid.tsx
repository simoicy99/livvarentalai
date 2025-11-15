import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Listing, FeedResponse } from "../../../shared/types";
import { FeedCard } from "./FeedCard";
import { CommunityPostCard } from "./CommunityPostCard";
import { Button } from "@/components/ui/button";

interface FeedGridProps {
  searchQuery?: string;
}

export function FeedGrid({ searchQuery = "" }: FeedGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["/api/feed", searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        pageSize: "8",
      });
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }
      const response = await fetch(`/api/feed?${params}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allItems: any[] = data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allItems.map((item) => {
          if (item.type === 'post') {
            return <CommunityPostCard key={`post-${item.id}`} post={item} />;
          } else {
            return <FeedCard key={`listing-${item.id}`} listing={item} />;
          }
        })}
      </div>

      {error && (
        <div className="text-center py-8 space-y-4" data-testid="error-feed">
          <p className="text-destructive">{(error as Error).message}</p>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
            Retry
          </Button>
        </div>
      )}

      {(isLoading || isFetchingNextPage) && (
        <div className="text-center py-8" data-testid="loading-feed">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">
            {isLoading ? "Loading listings..." : "Loading more listings..."}
          </p>
        </div>
      )}

      {!hasNextPage && allItems.length > 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground" data-testid="end-feed">
          You've reached the end
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
