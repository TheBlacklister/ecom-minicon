// Qikink API utility functions and types

export interface QikinkTokenResponse {
  ClientId: string;
  Accesstoken: string;
  expires_in: number;
}

export interface QikinkOrderRequest {
  order_number: string;
  qikink_shipping: number;
  gateway: 'Prepaid' | 'COD';
  total_order_value: string;
  line_items: QikinkLineItem[];
  shipping_address: QikinkShippingAddress;
  add_ons?: QikinkAddOns[];
}

export interface QikinkLineItem {
  search_from_my_products: 0 | 1;
  quantity: string;
  sku: string;
  print_type_id?: number;
  designs?: QikinkDesign[];
}

export interface QikinkDesign {
  design_code: string;
  width_inches: number;
  height_inches: number;
  placement_sku: string;
  design_link: string;
  mockup_link: string;
}

export interface QikinkShippingAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  zip: string;
  country_code: string;
}

export interface QikinkAddOns {
  box_packing?: 0 | 1;
  gift_wrap?: 0 | 1;
  rush_order?: 0 | 1;
  custom_letter?: string;
}

export interface QikinkOrderResponse {
  status_code: string;
  message: string;
  order_id?: number;
  order_number?: string;
  error?: string;
  details?: any;
}

// Client-side helper to get Qikink token
export async function getQikinkToken(userToken: string): Promise<string> {
  const response = await fetch('/api/qikink/auth', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get Qikink token');
  }

  const data = await response.json();
  return data.token;
}

// Client-side helper to create Qikink order
export async function createQikinkOrder(
  orderData: QikinkOrderRequest, 
  qikinkToken: string, 
  userToken: string
): Promise<QikinkOrderResponse> {
  const response = await fetch('/api/qikink/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderData,
      qikinkToken
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create Qikink order');
  }

  const data = await response.json();
  return data.qikinkResponse;
}

// Helper to validate order data
export function validateQikinkOrder(order: Partial<QikinkOrderRequest>): string[] {
  const errors: string[] = [];

  if (!order.order_number) errors.push('Order number is required');
  if (!order.gateway) errors.push('Gateway is required');
  if (!order.total_order_value) errors.push('Total order value is required');
  if (!order.line_items || order.line_items.length === 0) {
    errors.push('At least one line item is required');
  } else {
    order.line_items.forEach((item, index) => {
      if (!item.sku) errors.push(`SKU is required for line item ${index + 1}`);
      if (!item.quantity) errors.push(`Quantity is required for line item ${index + 1}`);
      if (item.search_from_my_products === 0 && (!item.designs || item.designs.length === 0)) {
        errors.push(`Designs are required for line item ${index + 1} when search_from_my_products is 0`);
      }
    });
  }

  if (!order.shipping_address) {
    errors.push('Shipping address is required');
  } else {
    const addr = order.shipping_address;
    if (!addr.first_name) errors.push('First name is required');
    if (!addr.address1) errors.push('Address line 1 is required');
    if (!addr.city) errors.push('City is required');
    if (!addr.zip) errors.push('ZIP code is required');
    if (!addr.country_code) errors.push('Country code is required');
    if (!addr.email) errors.push('Email is required');
    if (!addr.phone) errors.push('Phone is required');
  }

  return errors;
}

// Helper to format order data from your e-commerce system
export function formatOrderForQikink(
  orderNumber: string,
  items: any[],
  shippingAddress: any,
  totalAmount: number,
  gateway: 'Prepaid' | 'COD' = 'Prepaid'
): QikinkOrderRequest {
  return {
    order_number: orderNumber,
    qikink_shipping: 1,
    gateway,
    total_order_value: totalAmount.toString(),
    line_items: items.map(item => ({
      search_from_my_products: 0,
      quantity: item.quantity.toString(),
      sku: item.sku,
      print_type_id: item.print_type_id || 1,
      designs: item.designs || []
    })),
    shipping_address: {
      first_name: shippingAddress.firstName,
      last_name: shippingAddress.lastName,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2,
      phone: shippingAddress.phone,
      email: shippingAddress.email,
      city: shippingAddress.city,
      province: shippingAddress.state || shippingAddress.province,
      zip: shippingAddress.zipCode,
      country_code: shippingAddress.countryCode
    },
    add_ons: [{
      box_packing: 0,
      gift_wrap: 0,
      rush_order: 0
    }]
  };
}