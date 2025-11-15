import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Share2, Sparkles } from "lucide-react";

type CommunityPost = {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  agentType?: string;
  agentAction?: string;
  metadata?: any;
  createdAt: string;
};

interface CommunityPostCardProps {
  post: CommunityPost;
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const isAgentPost = !!post.agentType;

  return (
    <Card className="hover-elevate" data-testid={`card-post-${post.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            {post.userAvatar && <AvatarImage src={post.userAvatar} />}
            <AvatarFallback className={isAgentPost ? "bg-primary text-primary-foreground" : "bg-muted"}>
              {isAgentPost ? <Sparkles className="h-5 w-5" /> : post.userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold" data-testid={`text-username-${post.id}`}>
                {post.userName}
              </span>
              {isAgentPost && (
                <Badge variant="default" className="gap-1" data-testid={`badge-agent-${post.id}`}>
                  <Sparkles className="h-3 w-3" />
                  {post.agentType} Agent
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {isAgentPost && post.agentAction && (
              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-action-${post.id}`}>
                {post.agentAction}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
          {post.content}
        </p>

        {post.metadata && (
          <div className="rounded-md bg-muted p-3 text-sm">
            {post.metadata.listingTitle && (
              <p className="font-medium mb-1">{post.metadata.listingTitle}</p>
            )}
            {post.metadata.matchScore && (
              <p className="text-muted-foreground">
                Match Score: {post.metadata.matchScore}%
              </p>
            )}
            {post.metadata.amount && (
              <p className="text-muted-foreground">
                Amount: ${post.metadata.amount} {post.metadata.currency?.toUpperCase()}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-like-${post.id}`}>
            <ThumbsUp className="h-4 w-4" />
            <span className="text-xs">Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-comment-${post.id}`}>
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Comment</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-share-${post.id}`}>
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
