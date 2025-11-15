import { SignInButton, SignUpButton, UserButton as ClerkUserButton } from '@clerk/clerk-react';
import { useAuth } from '@/lib/clerk';
import { Button } from '@/components/ui/button';

export function UserButton() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" data-testid="loading-user-button" />;
  }

  if (isSignedIn) {
    return <ClerkUserButton data-testid="button-user-menu" />;
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm" data-testid="button-sign-in">
          Sign In
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button size="sm" data-testid="button-sign-up">
          Sign Up
        </Button>
      </SignUpButton>
    </div>
  );
}
