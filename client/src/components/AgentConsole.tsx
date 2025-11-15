import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, DollarSign, Search } from "lucide-react";

export interface AgentActivity {
  agent: "match" | "communication" | "payments" | "listing";
  action: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp: string;
}

interface AgentConsoleProps {
  activities: AgentActivity[];
  title?: string;
}

const AGENT_ICONS = {
  match: Search,
  communication: MessageSquare,
  payments: DollarSign,
  listing: Bot,
};

const AGENT_NAMES = {
  match: "Match Agent",
  communication: "Communication Agent",
  payments: "Payments Agent",
  listing: "Listing Agent",
};

const STATUS_COLORS = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  failed: "bg-destructive/10 text-destructive",
};

export function AgentConsole({ activities, title = "Agent Activity" }: AgentConsoleProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <Card data-testid="agent-console">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = AGENT_ICONS[activity.agent];
            return (
              <div
                key={index}
                className="flex items-start gap-3 text-sm"
                data-testid={`agent-activity-${index}`}
              >
                <div className="mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {AGENT_NAMES[activity.agent]}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${STATUS_COLORS[activity.status]}`}
                      data-testid={`agent-status-${index}`}
                    >
                      {activity.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm" data-testid={`agent-action-${index}`}>
                    {activity.action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
