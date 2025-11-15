# Livva Design Guidelines

## Design Approach

**Reference-Based Strategy**: Drawing from industry leaders that align with Livva's core values:
- **Airbnb**: Card-based property displays, trust indicators, clean booking flows
- **Linear**: Minimal dashboard aesthetics, subtle animations, excellent information hierarchy
- **Stripe**: Payment interfaces, trust badges, professional data presentation

**Design Principles**:
1. Trust through transparency - clear verification states, visible agent activity
2. Efficiency for power users - quick actions, keyboard shortcuts for dashboards
3. Warmth in automation - human-centric language despite AI-driven processes

## Typography

**Font Stack**:
- Primary: Inter (headings, UI elements, buttons)
- Secondary: System fonts for body text (performance optimization)

**Hierarchy**:
- Hero headlines: 3xl to 5xl, font-weight 700
- Section titles: 2xl to 3xl, font-weight 600
- Card titles: lg to xl, font-weight 600
- Body text: base, font-weight 400
- Captions/metadata: sm, font-weight 500
- Trust scores/stats: xl to 2xl, font-weight 700 (tabular numbers)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Tight: p-2, gap-2 (form inputs, compact lists)
- Standard: p-4, gap-4 (cards, buttons)
- Comfortable: p-6 to p-8 (sections, containers)
- Generous: p-12 to p-24 (page margins, hero sections)

**Grid Strategy**:
- Listing grids: 1 column mobile, 2 tablet, 3-4 desktop
- Dashboard cards: 1 column mobile, 2 desktop
- Feature sections: 2-3 columns for benefits/stats
- Max content width: max-w-7xl for full sections, max-w-4xl for forms

## Component Library

### Navigation
**Header**: Sticky, backdrop-blur-lg, logo left, nav center, user avatar + notifications right
**Tabs**: Underline style for dashboards (landlord/tenant/admin views)

### Cards
**Listing Cards**: 
- Rounded-xl, overflow-hidden
- Image aspect ratio 4:3, hover scale 1.02
- Price prominent (2xl, font-weight 700)
- Trust score badge (top-right overlay)
- Quick action buttons on hover (Message, Save, View)

**Dashboard Cards**:
- Rounded-lg, border subtle
- Icon or stat top-left
- Agent status indicator (green dot for active)
- Minimal padding (p-6)

### Forms & Inputs
**Style**: Rounded-lg borders, focus ring offset, placeholders in muted text
**Validation**: Inline error messages below fields, success checkmarks
**File uploads**: Drag-and-drop zones for property photos (dashed borders)

### Trust & Verification Elements
**Trust Score Display**: 
- Circular progress ring or horizontal bar
- Numerical score + verification badges
- Breakdown on hover/click (rental history, ID verified, references)

**Verification Badges**: Small pills with checkmark icons, positioned inline with names

### Messaging
**Thread List**: Avatar left, preview text truncated, timestamp top-right, unread indicator
**Chat Interface**: WhatsApp-inspired bubbles, sent/received distinction, typing indicators

### Agent Status Indicators
**Active Agent Pulse**: Subtle green dot with pulse animation
**Activity Feed**: Timeline-style list showing recent agent actions (posted listing, matched tenant, sent message)

## Animations

**Minimal Motion Strategy**:
- Card hover: scale 1.02, transition 200ms
- Page transitions: Fade in, no slide effects
- Loading states: Simple spinner or skeleton screens
- Agent activity: Subtle pulse on status dots only
- NO scroll-triggered animations except lazy image loading

## Images

### Hero Section
**Large hero image**: Full-width, 60-70vh height, showing a modern rental property interior or happy tenant/landlord interaction
- Overlay: Dark gradient (bottom to top) for text readability
- Buttons on image: backdrop-blur-md, semi-transparent backgrounds

### Listing Photos
**Property images**: High-quality, 4:3 aspect ratio, multiple per listing in carousel
**Placeholder**: Neutral gray with property icon when no image available

### Trust Elements
**Profile photos**: Circular avatars, 40px to 80px depending on context
**Verification icons**: Use Heroicons for checkmarks, shields, ID cards

### Placement Strategy
- Landing hero: Large aspirational property image
- Dashboard: Small avatar images only, focus on data
- Listings grid: Prominent property photos as primary visual element
- About/how it works: Illustrations or photos showing the rental process

## Page-Specific Layouts

### Landing Page
1. Hero: Full-width image, centered headline + subheadline, dual CTA (landlords/tenants)
2. How it works: 3-column grid explaining agent automation
3. Trust network: 2-column split (visual left, benefits right)
4. Stats: 4-column metrics (listings, matches, verified users, avg. time saved)
5. Testimonials: 2-column cards with photos
6. Final CTA: Full-width with gradient background

### Dashboards
**Layout**: Sidebar navigation left (fixed), main content area with breadcrumbs, action buttons top-right
**Sections**: Overview cards (row), active listings/searches (grid), recent messages (list), agent activity feed

### Listing Creation
**Multi-step form**: Progress indicator top, single column form, image upload prominent, live preview sidebar on desktop