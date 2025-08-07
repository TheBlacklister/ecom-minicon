# Comprehensive E-commerce Application Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema & Data Management](#database-schema--data-management)
4. [API Architecture](#api-architecture)
5. [State Management](#state-management)
6. [Component Architecture](#component-architecture)
7. [Authentication & Security](#authentication--security)
8. [User Interface & Experience](#user-interface--experience)
9. [Performance Optimizations](#performance-optimizations)
10. [Development Workflow](#development-workflow)
11. [Deployment & Configuration](#deployment--configuration)

---

## Project Overview

This is a modern, full-stack e-commerce application built with Next.js 15 and React 19, designed for selling apparel (primarily t-shirts). The application provides a complete shopping experience with user authentication, product browsing, cart management, wishlist functionality, and comprehensive user account management.

### Key Features
- Responsive product catalog with advanced filtering
- User authentication and profile management
- Shopping cart with buy-now functionality
- Wishlist management with real-time synchronization
- Address book management
- Coupon and discount system
- Real-time search functionality
- Progressive image loading and optimization
- Mobile-first responsive design

---

## Architecture & Technology Stack

### Frontend Technology Stack
```javascript
{
  "framework": "Next.js 15 with App Router",
  "runtime": "React 19",
  "language": "TypeScript",
  "ui_library": "Material-UI (MUI) v7",
  "styling": "Emotion CSS-in-JS + CSS Modules",
  "image_optimization": "Next.js Image + Sharp",
  "development_server": "Turbopack"
}
```

### Backend Technology Stack
```javascript
{
  "database": "Supabase (PostgreSQL)",
  "authentication": "Supabase Auth",
  "api": "Next.js API Routes",
  "orm": "Supabase JavaScript Client",
  "security": "Row Level Security (RLS)"
}
```

### Project Structure
```
src/
├── app/                        # Next.js App Router
│   ├── components/            # Reusable React components
│   │   ├── AuthProvider/      # Authentication context
│   │   ├── CountProvider/     # Cart/wishlist count management
│   │   ├── ThemeProvider/     # MUI theme configuration
│   │   ├── header/           # Navigation header
│   │   ├── footer/           # Site footer
│   │   ├── productCard/      # Product display component
│   │   ├── cartDrawer/       # Shopping cart sidebar
│   │   ├── cart/             # Full cart page
│   │   ├── wishList/         # Wishlist page
│   │   ├── account/          # User account management
│   │   └── categoryCards/    # Category navigation cards
│   ├── api/                  # API route handlers
│   │   ├── products/         # Product catalog API
│   │   ├── cart/            # Shopping cart API
│   │   ├── wishlist/        # Wishlist API
│   │   ├── auth/            # Authentication API
│   │   ├── profile/         # User profile API
│   │   └── addresses/       # Address management API
│   ├── (auth)/              # Authentication pages group
│   │   ├── login/           # Login page
│   │   └── signup/          # Registration page
│   ├── categories/          # Product category pages
│   ├── account/             # User account page
│   ├── cart/               # Shopping cart page
│   ├── wishlist/           # Wishlist page
│   ├── preCheckout/        # Product detail page
│   └── [static pages]/     # About, contact, policies, etc.
├── lib/                     # Utility libraries
│   ├── supabaseClient.ts   # Browser Supabase client
│   └── supabaseServer.ts   # Server-side Supabase client
└── types.ts                 # TypeScript type definitions
```

---

## Database Schema & Data Management

### Database Tables

#### Products Table
```sql
CREATE TABLE public.products (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    description text,
    price_before numeric,
    price_after numeric NOT NULL,
    discount_percentage numeric,
    category text[],
    collections text[],
    material text,
    images text[],
    size_chart_image text,
    available_sizes text[],
    available_colors text[],
    wash_care text,
    stock_quantity numeric,
    is_active boolean,
    slug text,
    created_at timestamp with time zone DEFAULT current_timestamp,
    updated_at timestamp with time zone DEFAULT current_timestamp
);
```

#### User Profiles Table
```sql
CREATE TABLE public.profiles (
    user_id uuid NOT NULL PRIMARY KEY,
    name text,
    email text,
    phone text,
    address text,
    created_at timestamp with time zone DEFAULT current_timestamp
);
```

#### Shopping Cart Table
```sql
CREATE TABLE public.cart (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    product_id bigint,
    quantity numeric DEFAULT 1,
    created_at timestamp with time zone DEFAULT current_timestamp,
    FOREIGN KEY (product_id) REFERENCES public.products(id)
);
```

#### Wishlist Table
```sql
CREATE TABLE public.wishlist (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    product_id bigint,
    created_at timestamp with time zone DEFAULT current_timestamp,
    FOREIGN KEY (product_id) REFERENCES public.products(id)
);
```

#### Addresses Table
```sql
CREATE TABLE public.addresses (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    name text,
    line1 text,
    city text,
    state text,
    pincode text,
    phone text,
    created_at timestamp with time zone DEFAULT current_timestamp
);
```

#### Orders and Order Items Tables
```sql
CREATE TABLE public.orders (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    status text,
    total_amount numeric,
    created_at timestamp with time zone DEFAULT current_timestamp
);

CREATE TABLE public.order_items (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id bigint,
    product_id bigint,
    quantity numeric DEFAULT 1,
    price numeric,
    created_at timestamp with time zone DEFAULT current_timestamp,
    FOREIGN KEY (order_id) REFERENCES public.orders(id),
    FOREIGN KEY (product_id) REFERENCES public.products(id)
);
```

### Row Level Security (RLS)
All user-specific tables implement RLS policies to ensure data security:
- Users can only access their own cart items
- Users can only manage their own wishlist
- Profile and address data is isolated per user
- Orders are restricted to the owning user

### TypeScript Data Models
```typescript
export interface Product {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  price_before: number | null;
  price_after: number;
  discount_percentage: number | null;
  category: string[];
  collections: string[];
  material: string | null;
  images: string[];
  size_chart_image: string | null;
  available_sizes: string[];
  available_colors: string[];
  wash_care: string | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  slug: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

---

## API Architecture

### API Route Pattern
All API routes follow a consistent pattern:
1. Extract authorization token from request headers
2. Validate user session with Supabase
3. Perform database operations with user context
4. Return standardized JSON responses with error handling

### Authentication Helper
```typescript
async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return { user: null, supabase: null, error: new Error('Auth session missing!') }
  }
  const supabase = createSupabaseServerClient(token)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { user: null, supabase: null, error }
  }
  return { user: data.user, supabase, error: null }
}
```

### API Endpoints

#### Products API (`/api/products`)
- **GET**: Retrieve all active products
- **Usage**: Public endpoint for product catalog
- **Response**: Array of Product objects

#### Cart API (`/api/cart`)
- **GET**: Retrieve user's cart items with product details
- **POST**: Add item to cart with buy-now support
- **PUT**: Update item quantity
- **DELETE**: Remove item from cart
- **Authentication**: Required for all operations

#### Wishlist API (`/api/wishlist`)
- **GET**: Retrieve user's wishlist with product details
- **POST**: Add product to wishlist
- **DELETE**: Remove product from wishlist
- **Authentication**: Required for all operations

#### Authentication API (`/api/auth`)
- **POST**: User registration with profile creation
- **GET**: Retrieve current user data
- **PUT**: Update user email/password
- **Features**: Integrated profile creation, error handling

#### Profile API (`/api/profile`)
- **GET**: Retrieve user profile data
- **POST**: Create new user profile
- **PUT**: Update existing profile
- **Authentication**: Required for all operations

#### Addresses API (`/api/addresses`)
- **GET**: Retrieve user's saved addresses
- **POST**: Add new address
- **PUT**: Update existing address
- **DELETE**: Remove address
- **Authentication**: Required for all operations

---

## State Management

### Context Providers Architecture

#### AuthProvider (`/src/app/components/AuthProvider/index.tsx`)
**Purpose**: Centralized authentication state management
```typescript
interface AuthContextValue {
  user: User | null
  signOut: () => Promise<void>
}
```

**Key Features**:
- Real-time authentication state updates via Supabase auth listeners
- Automatic route protection and redirection logic
- Session persistence across page reloads
- Clean sign-out functionality

**Navigation Logic**:
- Authenticated users on `/login` or `/signup` → redirect to home
- Unauthenticated users on protected routes → redirect to `/login`

#### CountProvider (`/src/app/components/CountProvider/index.tsx`)
**Purpose**: Global cart and wishlist count management
```typescript
interface CountContextType {
  cartCount: number;
  wishlistCount: number;
  updateCartCount: () => Promise<void>;
  updateWishlistCount: () => Promise<void>;
  incrementCartCount: () => void;
  decrementCartCount: () => void;
  incrementWishlistCount: () => void;
  decrementWishlistCount: () => void;
}
```

**Key Features**:
- Real-time count synchronization with server state
- Optimistic UI updates for immediate feedback
- Efficient caching and memoization
- Automatic updates on user state changes

#### ThemeProvider (`/src/app/components/ThemeProvider/index.tsx`)
**Purpose**: Material-UI theme configuration
```typescript
const theme = createTheme({
  typography: {
    fontFamily: '"Montserrat", sans-serif',
  },
  palette: {
    text: { primary: '#000' },
    background: { default: '#fff', paper: '#fff' },
  },
});
```

### Local State Management Patterns
- **Form State**: Controlled components with useState
- **Loading States**: Boolean flags for async operations
- **Error Handling**: Error state management with user feedback
- **Optimistic Updates**: Immediate UI updates before server confirmation

---

## Component Architecture

### Provider Components Hierarchy
```tsx
<AuthProvider>
  <CountProvider>
    <ThemeProvider>
      {!isAuthPage && <Header />}
      <main>{children}</main>
      {!isAuthPage && <Footer />}
    </ThemeProvider>
  </CountProvider>
</AuthProvider>
```

### Core Components Analysis

#### Header Component (`/src/app/components/header/index.tsx`)
**Features**:
- Responsive navigation (desktop dropdowns, mobile accordion drawer)
- Real-time product search with autocomplete
- User action buttons with live count badges
- Video logo with autoplay functionality
- Authentication-aware UI behavior

**State Management**: Complex local state for menus, search, drawers
**Performance**: Search debouncing, localStorage caching

#### ProductCard Component (`/src/app/components/productCard/index.tsx`)
**Advanced Features**:
- Progressive image loading with skeleton states
- Multi-image support with swipe navigation
- Touch-friendly controls with gesture recognition
- Wishlist integration with optimistic updates
- Dynamic responsive sizing and font adjustment

**Performance Optimizations**:
- Image preloading and caching
- Intersection Observer for lazy loading
- Memoized callbacks and event handlers

#### CartDrawer Component (`/src/app/components/cartDrawer/index.tsx`)
**Features**:
- Slide-out cart overview with real-time data
- Quantity adjustment controls
- Live price calculations
- Quick checkout navigation
- Loading states and error handling

#### Cart Component (`/src/app/components/cart/index.tsx`)
**Comprehensive Functionality**:
- Complete checkout flow with multiple steps
- Address management with CRUD operations
- Coupon system with real-time price updates
- Buy-now support with special handling
- Responsive two-column layout

### Reusable Component Patterns
- **Consistent Props Interface**: Standardized prop structures across components
- **Error Boundaries**: Graceful error handling with fallback UI
- **Loading States**: Skeleton components and spinners
- **Responsive Design**: Breakpoint-aware component behavior

---

## Authentication & Security

### Authentication Flow
1. **Registration**: 
   - Supabase Auth user creation
   - Automatic profile record creation
   - Email verification (optional)
   - Redirect to login page

2. **Login**:
   - Email/password validation
   - Session token generation
   - Automatic redirection based on user state
   - Persistent session storage

3. **Session Management**:
   - Real-time auth state listeners
   - Automatic token refresh
   - Clean session cleanup on logout

### Security Implementation

#### Row Level Security (RLS)
```sql
-- Enable RLS on user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```

#### API Security Patterns
- **Token Validation**: All protected routes validate bearer tokens
- **User Context**: Database queries filtered by authenticated user ID
- **Error Sanitization**: Generic error messages prevent information leakage
- **Input Validation**: Request body validation in API routes

#### Content Security
- **XSS Prevention**: React's built-in sanitization + CSP headers
- **Image Security**: Secure SVG handling with sandboxing
- **Path Traversal Protection**: Sanitized file path handling

---

## User Interface & Experience

### Design System
- **Typography**: Montserrat font family for consistent branding
- **Color Palette**: Black text on white background for clean aesthetics
- **Spacing**: Material-UI's 8px grid system
- **Responsive Breakpoints**: Mobile-first with xs, sm, md, lg, xl breakpoints

### UI/UX Patterns

#### Navigation Patterns
- **Desktop**: Mega menu dropdowns with hover interactions
- **Mobile**: Full-screen drawer with accordion navigation
- **Breadcrumb Navigation**: Clear page hierarchy indication
- **Tab Navigation**: Account management with clean tab interface

#### Interaction Patterns
- **Progressive Enhancement**: Graceful degradation for failed states
- **Optimistic Updates**: Immediate feedback before server confirmation
- **Loading States**: Skeleton loading and progress indicators
- **Error Handling**: User-friendly error messages with retry options

#### Visual Patterns
- **Card-based Layout**: Consistent product and content presentation
- **Image Carousels**: Touch-friendly image navigation
- **Hover Effects**: Subtle animations for better interaction feedback
- **Responsive Grid**: Dynamic grid layouts across screen sizes

### Accessibility Features
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Tab-accessible interactive elements
- **Color Contrast**: High contrast ratios for text readability
- **Focus Management**: Clear focus indicators and logical tab order

---

## Performance Optimizations

### Image Optimization Strategy
```typescript
// Next.js Configuration
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  }
}
```

**Implementation Features**:
- **Format Conversion**: Automatic WebP/AVIF conversion
- **Responsive Images**: Dynamic srcSet generation
- **Lazy Loading**: Intersection Observer-based loading
- **Progressive Loading**: Skeleton → blur → sharp image transition
- **Caching Strategy**: 1-year cache TTL with immutable headers

### Data Fetching Optimizations
- **Client-side Caching**: LocalStorage for frequently accessed data
- **Parallel Requests**: Batched API calls for related data
- **Optimistic Updates**: Immediate UI updates with server sync
- **Debounced Search**: Reduced API calls for search functionality

### Bundle Optimization
- **Code Splitting**: Page-level splitting with dynamic imports
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Webpack configuration for image handling
- **Performance Budgets**: 500KB asset size limits

### Runtime Performance
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtualization**: Efficient rendering of large lists
- **Event Delegation**: Optimized event handling patterns
- **Memory Management**: Proper cleanup of event listeners and timers

---

## Development Workflow

### Development Commands
```bash
# Development server with Turbopack
npm run dev --turbopack

# Production build
npm run build

# Start production server
npm start

# Code quality checks
npm run lint
```

### File Structure Conventions
- **Component Files**: `index.tsx` with optional `index.module.css`
- **API Routes**: RESTful naming with HTTP method exports
- **Type Definitions**: Centralized in `types.ts` with interfaces
- **Utilities**: Shared functions in `lib/` directory

### Code Quality Standards
- **TypeScript**: Strict type checking with comprehensive interfaces
- **ESLint**: Next.js recommended configuration with custom rules
- **Code Formatting**: Consistent styling with automated formatting
- **Component Patterns**: Functional components with hooks

### Environment Configuration
```bash
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Deployment & Configuration

### Next.js Configuration (`next.config.ts`)
```typescript
const nextConfig = {
  // Performance optimizations
  compress: true,
  experimental: {
    scrollRestoration: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
  
  // Caching headers
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
    ];
  },
};
```

### Supabase Configuration
- **Database**: PostgreSQL with automatic backups
- **Authentication**: Email/password with optional social providers
- **Security**: Row Level Security policies for data isolation
- **Real-time**: Optional real-time subscriptions for live updates

### Production Considerations
- **Build Optimization**: Static generation where possible
- **CDN Integration**: Automatic asset optimization with Vercel
- **Monitoring**: Error tracking and performance monitoring
- **Scaling**: Horizontal scaling with load balancing

### Security Configuration
- **Environment Variables**: Secure storage of API keys and secrets
- **HTTPS**: Enforced secure connections
- **CORS**: Proper origin validation for API requests
- **Rate Limiting**: API route protection against abuse

---

## Key Architecture Decisions

### Technology Choices Rationale
1. **Next.js 15 + React 19**: Latest features, App Router for better SEO
2. **Supabase**: Managed PostgreSQL with built-in auth and real-time features
3. **Material-UI v7**: Comprehensive component library with theming
4. **TypeScript**: Type safety and better developer experience
5. **Turbopack**: Faster development builds and hot reloading

### Scalability Considerations
- **Component Architecture**: Modular, reusable components
- **API Design**: RESTful endpoints with consistent patterns
- **Database Schema**: Normalized structure with efficient indexing
- **Caching Strategy**: Multi-level caching for optimal performance
- **Error Handling**: Comprehensive error boundaries and fallbacks

### Future Enhancement Opportunities
- **Order Management**: Complete order processing system
- **Payment Integration**: Stripe or similar payment gateway
- **Inventory Management**: Stock tracking and low-stock alerts
- **Admin Dashboard**: Product management and analytics
- **Mobile App**: React Native version for mobile platforms
- **SEO Optimization**: Enhanced meta tags and structured data
- **Internationalization**: Multi-language and currency support

---

This documentation provides a comprehensive overview of the e-commerce application's architecture, implementation details, and operational considerations. The application demonstrates modern full-stack development practices with strong emphasis on performance, security, and user experience.