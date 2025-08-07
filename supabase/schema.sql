-- 
-- PostgreSQL database dump
-- Generated from remote Supabase database schema
-- 

-- Profiles table
CREATE TABLE public.profiles (
    user_id uuid NOT NULL PRIMARY KEY,
    name text,
    email text,
    phone text,
    address text,
    created_at timestamp with time zone DEFAULT current_timestamp
);

-- Products table (main structure)
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

-- Addresses table
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

-- Cart table
CREATE TABLE public.cart (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    product_id bigint,
    quantity numeric DEFAULT 1,
    created_at timestamp with time zone DEFAULT current_timestamp
);

-- Wishlist table
CREATE TABLE public.wishlist (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    product_id bigint,
    created_at timestamp with time zone DEFAULT current_timestamp
);

-- Orders table
CREATE TABLE public.orders (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    status text,
    total_amount numeric,
    created_at timestamp with time zone DEFAULT current_timestamp
);

-- Order items table
CREATE TABLE public.order_items (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id bigint,
    product_id bigint,
    quantity numeric DEFAULT 1,
    price numeric,
    created_at timestamp with time zone DEFAULT current_timestamp
);

-- Reviews table
CREATE TABLE public.reviews (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT current_timestamp,
    updated_at timestamp with time zone DEFAULT current_timestamp,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Backup tables (from your existing database)
CREATE TABLE public.products_backup_before_redesign (
    id numeric,
    title text,
    subtitle text,
    item text,
    label text,
    price numeric,
    color text,
    size text,
    image text,
    img text,
    created_at timestamp with time zone DEFAULT current_timestamp
);

CREATE TABLE public.products_old (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    item text,
    label text,
    price numeric,
    color text,
    size text,
    image text,
    img text,
    created_at timestamp with time zone DEFAULT current_timestamp
);

-- Foreign key constraints
ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Functions
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$;

-- Enable Row Level Security (RLS) on user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies (these would be set up separately in your Supabase dashboard)
-- Products table remains publicly readable (no RLS needed)