# Livva - AI-Powered Rental Platform

## Overview

Livva is a rental listing aggregator with vibrant orange branding, featuring aggregated listings from Livva, Zillow, and Apartments.com. The platform currently focuses on San Francisco Bay Area listings and includes search functionality, clickable infinite-scroll feed, and Locus deposit integration. The long-term vision includes a 5-layer agent architecture handling posting/updates, search/matching, communication, verification/trust, and payments.

**Current Features (MVP):**
- Vibrant orange theme (#ff6b35 primary color)
- Navbar with integrated search bar and profile menu
- Infinite scroll feed of aggregated listings (Livva, Zillow, Apartments.com)
- Full-text search across listings (title, description, city, address)
- Clickable listing cards navigating to detailed view
- Individual listing detail pages with full property information
- Locus deposit integration for holding properties
- All listings focused on San Francisco Bay Area locations

**Future Vision:**
- 5-layer agent architecture: listing management, search/match, communication, verification/trust, payments
- AI-powered matchmaking between properties and tenants
- Trust network with verification scores
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
- Vibrant orange primary color (#ff6b35 / HSL: 14 100% 60%)
- CSS variables for theming with light/dark mode support
- Custom color system with HSL values for dynamic theming
- Design system inspired by Airbnb (cards), Linear (dashboards), and Stripe (payments)

**Component Library:**
- shadcn/ui components (Radix UI primitives)
- Custom components: Navbar (search + profile), Hero, FeedGrid (infinite scroll), FeedCard (clickable listing cards)
- Reusable UI patterns with consistent spacing primitives
- All components include data-testid attributes for e2e testing

**State Management:**
- TanStack Query (React Query) for server state management
- Custom hooks for auth state (`useAuth`)
- Form state via React Hook Form with Zod validation

**Routing:** Wouter for lightweight client-side routing
- `/` - Home page with navbar, hero, and infinite scroll feed
- `/listing/:id` - Individual listing detail page with Locus deposit flow

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
- `/api/feed?q=<query>&page=<page>&pageSize=<size>` - Paginated listings with search support
- `/api/listing/:id` - Individual listing retrieval
- `/api/deposit` - Locus deposit session creation
- Request/response logging middleware
- Error handling with appropriate HTTP status codes
- Future: Session-based authentication via Replit Auth

**Key Services:**
- `agentService.ts`: Listing aggregation from multiple sources (Livva, Zillow, Apartments.com) with search filtering
- `locus.ts`: Locus deposit integration for property holds
- Mock data services: `zillow.ts`, `apartmentsDotCom.ts` with SF Bay Area listings
- Future: `aiService.ts` for AI-powered matchmaking, `replitAuth.ts` for authentication

**Session Management:**
- PostgreSQL-backed sessions via connect-pg-simple
- 7-day session TTL
- Secure cookies (httpOnly, secure flags)

**Data Models (Current):**
- Listings: Properties with title, description, price, address, city, state, bedrooms, bathrooms, sqft, images, source (internal/zillow/apartments), availability dates
- Mock data: 10 SF Bay Area listings across Mission, Noe Valley, SoMa, Financial District, Sunset, Pacific Heights, Hayes Valley, Marina, Castro, North Beach

**Future Data Models:**
- Users (landlord/tenant/both roles)
- Messages (conversation threads)
- Matches (AI-scored tenant-listing pairs)
- Trust Scores (verification data)
- Tenant Preferences (search criteria)
- Agent Activities (automation logs)

### Search & Filtering

**Current Implementation:**
- Full-text search across listing title, description, city, and address
- Search query passed via `q` parameter to `/api/feed` endpoint
- Agent service filters aggregated listings based on query
- Real-time search results update in infinite scroll feed

**Future AI Integration:**
- OpenAI GPT-5 for intelligent matchmaking
- AI-scored tenant-listing pairs (0-100 match scores)
- Natural language search understanding
- Personalized recommendations based on preferences

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
- Locus Deposit Integration: Property holds and deposit management
- Mock deposit sessions for testing deposit flows
- Future: Stripe integration for full payment processing

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