import { cn } from "@/lib/utils";

interface AgentActivityIndicatorProps {
  active: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function AgentActivityIndicator({ active, size = "md", label }: AgentActivityIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            "rounded-full",
            sizeClasses[size],
            active ? "bg-green-500" : "bg-muted"
          )}
        />
        {active && (
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75",
              sizeClasses[size]
            )}
          />
        )}
      </div>
      {label && (
        <span className={cn(
          "text-muted-foreground",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          {label}
        </span>
      )}
    </div>
  );
}
