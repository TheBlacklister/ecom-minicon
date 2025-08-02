# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev --turbopack` - Start development server with Turbopack
- `npm run build` - Build the production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a Next.js 15 e-commerce application with the App Router using React 19. The project follows a modern full-stack architecture:

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI**: Material-UI (MUI) v7 with Emotion for styling
- **Backend**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth
- **Image Optimization**: Next.js Image component with Sharp

### Core Architecture Patterns

1. **Client/Server Component Split**: The app uses both client and server components strategically. Layout components like Header/Footer use client components for interactivity, while pages can leverage server components for data fetching.

2. **Supabase Integration**: 
   - Client-side: `src/lib/supabaseClient.ts` for browser operations
   - Server-side: `src/lib/supabaseServer.ts` for server-side operations with token support
   - Row Level Security (RLS) policies protect user data

3. **API Route Structure**: RESTful API routes in `src/app/api/` handle:
   - `/api/products` - Product catalog
   - `/api/cart` - Shopping cart operations
   - `/api/wishlist` - Wishlist management
   - `/api/addresses` - User address management
   - `/api/auth` - Authentication operations
   - `/api/profile` - User profile management

### Database Schema

The Supabase schema includes:
- `products` - Product catalog with images, variants, pricing
- `profiles` - User profiles linked to auth.users
- `addresses` - Multiple addresses per user
- `cart` - Shopping cart items
- `wishlist` - User wishlists
- `orders` & `order_items` - Order management

All user-related tables use RLS policies to ensure data security.

### Key Directories

- `src/app/` - Next.js App Router pages and layouts
- `src/app/components/` - Reusable React components organized by feature
- `src/app/api/` - API route handlers
- `src/lib/` - Utility libraries and configuration
- `src/types.ts` - TypeScript type definitions
- `public/products/` - Product images organized by category and variant
- `supabase/` - Database schema and migrations

### Component Architecture

Components are organized by feature in `src/app/components/`:
- `AuthProvider/` - Authentication context and state management
- `ThemeProvider/` - MUI theme configuration
- `header/` & `footer/` - Layout components
- `productCard/`, `cart/`, `wishList/` - Feature-specific components
- `cartDrawer/` - Shopping cart overlay
- `account/` - User account management

### Authentication Flow

The app uses Supabase Auth with automatic redirects:
- Authenticated users on `/login` or `/signup` redirect to home
- Auth state changes trigger navigation updates
- RLS policies secure all user data operations

### Styling Approach

- Material-UI component library for consistent design
- CSS modules for component-specific styles (e.g., `header/index.module.css`)
- Global styles in `globals.css`
- Responsive design with MUI breakpoints

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Data Types

The main `Product` interface in `src/types.ts` defines the product schema with:
- Basic info (title, subtitle, description)
- Pricing (before/after, discount percentage)
- Variants (sizes, colors, images)
- Inventory (stock quantity, active status)
- SEO (slug) and timestamps