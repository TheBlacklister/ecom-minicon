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
  sku: Record<string, string> | null; // Size -> SKU mapping
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_id: string;
}

export interface CartItem {
  quantity: number;
  selected_size: string;
  product: Product;
}

export interface QikinkDesign {
  design_code: string;
  placement: string;
  height_inches: string;
  width_inches: string;
  design_url: string;
  mockup_url: string | null;
  design_mockup_url: string | null;
  printing_cost: string;
}

export interface QikinkLineItem {
  sku: string;
  quantity: string;
  price: string;
  designs?: QikinkDesign[];
}

export interface QikinkShipping {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  zip: string;
  province: string | null;
  country_code: string;
  awb: string | null;
  tracking_link: string;
  courier_provider_name: string | null;
}

export interface QikinkOrder {
  order_id: number;
  number: string;
  created_on: string;
  live_date: string | null;
  status: string;
  shipping_type: string;
  payment_type: string;
  total_order_value: string;
  shipping: QikinkShipping;
  line_items: QikinkLineItem[];
  add_ons: any[];
}
