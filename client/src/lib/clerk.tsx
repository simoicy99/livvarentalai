import { ClerkProvider as BaseClerkProvider, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  );
}

export { useClerkAuth as useAuth, useUser };
