import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import ListingDetail from "@/pages/listing-detail";
import AgentDemo from "@/pages/agent-demo";
import Portal from "@/pages/portal";
import NotFound from "@/pages/not-found";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// make clerk optional if key is not configured correctly
const hasValidClerkKey = CLERK_PUBLISHABLE_KEY?.startsWith('pk_');

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/agents" component={AgentDemo} />
      <Route path="/portal" component={Portal} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  if (hasValidClerkKey && CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    );
  }

  // fallback without clerk when not configured
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
