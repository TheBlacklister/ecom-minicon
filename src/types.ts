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

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_id: string;
}
