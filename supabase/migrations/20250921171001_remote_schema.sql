create table "public"."addresses" (
    "id" bigint generated always as identity not null,
    "user_id" uuid,
    "name" text,
    "line1" text,
    "city" text,
    "state" text,
    "pincode" text,
    "phone" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."cart" (
    "id" bigint generated always as identity not null,
    "user_id" uuid,
    "product_id" bigint,
    "quantity" numeric default 1,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "selected_size" text
);


create table "public"."order_items" (
    "id" bigint generated always as identity not null,
    "order_id" bigint,
    "product_id" bigint,
    "quantity" numeric default 1,
    "price" numeric,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "selected_size" text
);


alter table "public"."order_items" enable row level security;

create table "public"."orders" (
    "id" bigint generated always as identity not null,
    "user_id" uuid,
    "status" text,
    "total_amount" numeric,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "qikink_order_id" bigint,
    "order_number" text,
    "payment_mode" text,
    "subtotal" numeric,
    "shipping" numeric,
    "taxes" numeric,
    "coupon_discount" numeric,
    "coupon_code" text,
    "shipping_address" jsonb
);


create table "public"."products" (
    "id" bigint generated always as identity not null,
    "title" text not null,
    "subtitle" text,
    "description" text,
    "price_before" numeric,
    "price_after" numeric not null,
    "discount_percentage" numeric,
    "category" text[],
    "collections" text[],
    "material" text,
    "images" text[],
    "size_chart_image" text,
    "available_sizes" text[],
    "available_colors" text[],
    "wash_care" text,
    "stock_quantity" numeric,
    "is_active" boolean,
    "slug" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "sku" jsonb
);


create table "public"."profiles" (
    "user_id" uuid not null,
    "name" text,
    "email" text,
    "phone" text,
    "address" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."reviews" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "product_id" bigint not null,
    "rating" integer not null,
    "comment" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."reviews" enable row level security;

create table "public"."wishlist" (
    "id" bigint generated always as identity not null,
    "user_id" uuid,
    "product_id" bigint,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX addresses_pkey ON public.addresses USING btree (id);

CREATE UNIQUE INDEX cart_pkey ON public.cart USING btree (id);

CREATE INDEX idx_products_sku_jsonb ON public.products USING gin (sku);

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);

CREATE INDEX idx_reviews_product_id ON public.reviews USING btree (product_id);

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);

CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX wishlist_pkey ON public.wishlist USING btree (id);

alter table "public"."addresses" add constraint "addresses_pkey" PRIMARY KEY using index "addresses_pkey";

alter table "public"."cart" add constraint "cart_pkey" PRIMARY KEY using index "cart_pkey";

alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."wishlist" add constraint "wishlist_pkey" PRIMARY KEY using index "wishlist_pkey";

alter table "public"."cart" add constraint "cart_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."cart" validate constraint "cart_product_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."order_items" add constraint "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."order_items" validate constraint "order_items_product_id_fkey";

alter table "public"."reviews" add constraint "reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_product_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

alter table "public"."wishlist" add constraint "wishlist_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."wishlist" validate constraint "wishlist_product_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_sku(product_id_param bigint, size_param text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
  DECLARE
      product_sku jsonb;
  BEGIN
      SELECT sku INTO product_sku FROM public.products WHERE id = product_id_param;

      IF product_sku IS NULL THEN
          RETURN NULL;
      END IF;

      RETURN product_sku ->> size_param;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.update_product_sku(product_id_param bigint, size_param text, sku_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
  DECLARE
      current_sku jsonb;
      updated_sku jsonb;
  BEGIN
      SELECT sku INTO current_sku FROM public.products WHERE id = product_id_param;

      IF current_sku IS NULL THEN
          current_sku := '{}'::jsonb;
      END IF;

      updated_sku := current_sku || jsonb_build_object(size_param, sku_param);

      UPDATE public.products
      SET sku = updated_sku, updated_at = current_timestamp
      WHERE id = product_id_param;

      RETURN updated_sku;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.update_product_sku_bulk(product_id_param bigint, sku_object jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
  BEGIN
      UPDATE public.products
      SET sku = sku_object, updated_at = current_timestamp
      WHERE id = product_id_param;

      RETURN sku_object;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."addresses" to "anon";

grant insert on table "public"."addresses" to "anon";

grant references on table "public"."addresses" to "anon";

grant select on table "public"."addresses" to "anon";

grant trigger on table "public"."addresses" to "anon";

grant truncate on table "public"."addresses" to "anon";

grant update on table "public"."addresses" to "anon";

grant delete on table "public"."addresses" to "authenticated";

grant insert on table "public"."addresses" to "authenticated";

grant references on table "public"."addresses" to "authenticated";

grant select on table "public"."addresses" to "authenticated";

grant trigger on table "public"."addresses" to "authenticated";

grant truncate on table "public"."addresses" to "authenticated";

grant update on table "public"."addresses" to "authenticated";

grant delete on table "public"."addresses" to "service_role";

grant insert on table "public"."addresses" to "service_role";

grant references on table "public"."addresses" to "service_role";

grant select on table "public"."addresses" to "service_role";

grant trigger on table "public"."addresses" to "service_role";

grant truncate on table "public"."addresses" to "service_role";

grant update on table "public"."addresses" to "service_role";

grant delete on table "public"."cart" to "anon";

grant insert on table "public"."cart" to "anon";

grant references on table "public"."cart" to "anon";

grant select on table "public"."cart" to "anon";

grant trigger on table "public"."cart" to "anon";

grant truncate on table "public"."cart" to "anon";

grant update on table "public"."cart" to "anon";

grant delete on table "public"."cart" to "authenticated";

grant insert on table "public"."cart" to "authenticated";

grant references on table "public"."cart" to "authenticated";

grant select on table "public"."cart" to "authenticated";

grant trigger on table "public"."cart" to "authenticated";

grant truncate on table "public"."cart" to "authenticated";

grant update on table "public"."cart" to "authenticated";

grant delete on table "public"."cart" to "service_role";

grant insert on table "public"."cart" to "service_role";

grant references on table "public"."cart" to "service_role";

grant select on table "public"."cart" to "service_role";

grant trigger on table "public"."cart" to "service_role";

grant truncate on table "public"."cart" to "service_role";

grant update on table "public"."cart" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant references on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant trigger on table "public"."order_items" to "anon";

grant truncate on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant references on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant trigger on table "public"."order_items" to "authenticated";

grant truncate on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."wishlist" to "anon";

grant insert on table "public"."wishlist" to "anon";

grant references on table "public"."wishlist" to "anon";

grant select on table "public"."wishlist" to "anon";

grant trigger on table "public"."wishlist" to "anon";

grant truncate on table "public"."wishlist" to "anon";

grant update on table "public"."wishlist" to "anon";

grant delete on table "public"."wishlist" to "authenticated";

grant insert on table "public"."wishlist" to "authenticated";

grant references on table "public"."wishlist" to "authenticated";

grant select on table "public"."wishlist" to "authenticated";

grant trigger on table "public"."wishlist" to "authenticated";

grant truncate on table "public"."wishlist" to "authenticated";

grant update on table "public"."wishlist" to "authenticated";

grant delete on table "public"."wishlist" to "service_role";

grant insert on table "public"."wishlist" to "service_role";

grant references on table "public"."wishlist" to "service_role";

grant select on table "public"."wishlist" to "service_role";

grant trigger on table "public"."wishlist" to "service_role";

grant truncate on table "public"."wishlist" to "service_role";

grant update on table "public"."wishlist" to "service_role";

create policy "Reviews are viewable by everyone"
on "public"."reviews"
as permissive
for select
to public
using (true);


create policy "Users can delete own reviews"
on "public"."reviews"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own reviews"
on "public"."reviews"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own reviews"
on "public"."reviews"
as permissive
for update
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();


