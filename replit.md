# Livva - AI-Powered Rental Platform

## Overview

Livva is an agentic AI rental platform that automates long-term rental workflows for landlords and tenants. The platform uses intelligent agents to handle property listings, tenant-landlord matching, messaging coordination, and trust network verification. The system aims to make renting faster, fairer, and more human through AI automation while maintaining human-centric interactions.

**Core Capabilities:**
- Multi-channel property listing management with AI agent automation
- AI-powered matchmaking between properties and tenants
- Unified communication layer for inquiries and follow-ups
- Trust network with verification scores and reputation data
- Payment processing via Stripe integration
- Role-based dashboards (landlord, tenant, admin)

## User Preferences

Preferred communication style: Simple, everyday language.

**Code Style:**
- Use lowercase comments focused on "why" rather than "what"
- Keep comments short and meaningful
- Avoid em dashes (—) in UI copy
- Prefer clear, minimal, production-ready code over demos

**Technical Preferences:**
- React + TypeScript with strict typing
- Modern ES modules (ESM)
- Tailwind CSS for styling with shadcn/ui components
- Framer Motion for subtle animations
- Clean, maintainable architecture

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript in a Vite-powered SPA

**Styling System:**
- Tailwind CSS with custom design tokens (New York style from shadcn/ui)
- CSS variables for theming with light/dark mode support
- Custom color system with HSL values for dynamic theming
- Design system inspired by Airbnb (cards), Linear (dashboards), and Stripe (payments)

**Component Library:**
- shadcn/ui components (Radix UI primitives)
- Custom components for domain-specific features (ListingCard, TrustScoreBadge, AgentActivityIndicator)
- Reusable UI patterns with consistent spacing primitives

**State Management:**
- TanStack Query (React Query) for server state management
- Custom hooks for auth state (`useAuth`)
- Form state via React Hook Form with Zod validation

**Routing:** Wouter for lightweight client-side routing

**Animation:** Framer Motion for component transitions and micro-interactions

**Key Design Patterns:**
- Protected routes requiring authentication
- Loading states with skeleton screens
- Optimistic UI updates for better UX
- Role-based UI rendering (landlord vs tenant views)

### Backend Architecture

**Runtime:** Node.js with Express server

**Database ORM:** Drizzle ORM with PostgreSQL dialect via Neon serverless

**API Design:**
- RESTful endpoints under `/api` prefix
- Session-based authentication via Replit Auth (OpenID Connect)
- Request/response logging middleware
- Error handling with appropriate HTTP status codes

**Key Services:**
- `storage.ts`: Data access layer abstracting database operations
- `aiService.ts`: OpenAI integration for AI-powered matchmaking
- `replitAuth.ts`: Authentication setup with Passport.js strategy
- Stripe integration for payment processing

**Session Management:**
- PostgreSQL-backed sessions via connect-pg-simple
- 7-day session TTL
- Secure cookies (httpOnly, secure flags)

**Data Models:**
- Users (with landlord/tenant/both roles)
- Listings (properties with amenities, images, pricing)
- Messages (conversation threads)
- Matches (AI-scored tenant-listing pairs)
- Trust Scores (verification and reputation data)
- Tenant Preferences (search criteria)
- Agent Activities (AI automation logs)

### AI Integration

**Provider:** OpenAI via custom base URL configuration

**Model:** GPT-5 (latest as of August 2025)

**Use Cases:**
- Matchmaking algorithm: Analyzes listing details against tenant preferences to generate match scores (0-100) with reasoning
- Returns structured JSON responses for predictable parsing
- Considers budget compatibility, location preferences, amenities, and property types

**Pattern:** Server-side AI calls to protect API keys and enable rate limiting

### Database Schema

**Core Tables:**
- `sessions`: Replit auth session storage
- `users`: User profiles with role types, verification status, Stripe customer IDs
- `listings`: Property details with JSON amenities, images arrays, geolocation
- `messages`: Conversation data between users
- `matches`: AI-generated matches with scores and status tracking
- `trust_scores`: Verification flags (ID, phone, email) and numerical trust ratings
- `tenant_preferences`: Search filters and requirements
- `agent_activities`: Audit log of AI agent actions

**Relationships:**
- Users have many listings, messages, trust scores
- Listings belong to landlords (users)
- Matches connect listings to tenants with AI-generated scores
- Trust scores are user-specific with verification booleans

**Validation:** Zod schemas for runtime type safety on inserts/updates

### Development Workflow

**Build Process:**
- Vite for fast client-side development with HMR
- esbuild for server bundling in production
- TypeScript compilation checking via `tsc`

**Environment Variables:**
- `DATABASE_URL`: Neon PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `STRIPE_SECRET_KEY`: Stripe API credentials
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI access
- `ISSUER_URL`: Replit auth OIDC endpoint

**Scripts:**
- `dev`: Development server with tsx watch mode
- `build`: Production build (client + server)
- `start`: Production server
- `db:push`: Push schema changes via Drizzle Kit

## External Dependencies

**Infrastructure:**
- Neon Database: Serverless PostgreSQL with WebSocket support
- Replit Auth: OpenID Connect authentication provider
- Replit Deployment: Hosting environment with automatic provisioning

**Payment Processing:**
- Stripe API (v2023-10-16): Payment flows, customer management
- @stripe/stripe-js: Client-side payment elements
- @stripe/react-stripe-js: React bindings for Stripe

**AI Services:**
- OpenAI API: GPT-5 model for matchmaking intelligence
- Custom base URL configuration for flexible deployment

**UI Libraries:**
- Radix UI: Unstyled, accessible component primitives (20+ components)
- Tailwind CSS: Utility-first styling framework
- Framer Motion: Animation library
- Lucide React: Icon system

**Form Handling:**
- React Hook Form: Form state management
- Zod: Schema validation
- @hookform/resolvers: Zod integration for forms

**Data Fetching:**
- TanStack Query: Server state synchronization, caching, mutations
- Custom query client with credential-based fetching

**Session Store:**
- connect-pg-simple: PostgreSQL session store for Express

**Development Tools:**
- Vite plugins: Runtime error overlay, dev banner, source mapping
- TypeScript: Strict mode with path aliases
- ESLint-ready configuration