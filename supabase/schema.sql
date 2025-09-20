-- Fresh schema dump from Supabase database
-- Generated on 2025-09-20

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

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
    updated_at timestamp with time zone DEFAULT current_timestamp,
    sku text
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
    updated_at timestamp with time zone DEFAULT current_timestamp
);

-- Foreign key constraints
ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

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

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for addresses
CREATE POLICY "Users can view own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for cart
CREATE POLICY "Users can view own cart" ON public.cart
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own cart" ON public.cart
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON public.cart
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart" ON public.cart
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own wishlist" ON public.wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist" ON public.wishlist
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products USING GIN(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_cart_user_id ON public.cart(user_id);
CREATE INDEX idx_cart_product_id ON public.cart(product_id);
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON public.wishlist(product_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();