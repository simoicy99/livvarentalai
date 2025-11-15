import { clerkClient, createClerkClient } from '@clerk/express';

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required');
}

export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export { clerkClient };
