'use client';

import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { createClient } from '@supabase/supabase-js';
import { getQikinkToken, createQikinkOrder, QikinkOrderRequest } from '@/lib/qikink';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QikinkOrderExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleCreateOrder = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to create orders');
      }

      // Example order data
      const orderData: QikinkOrderRequest = {
        order_number: `ORDER_${Date.now()}`,
        qikink_shipping: 1,
        gateway: 'Prepaid',
        total_order_value: '1499.00',
        line_items: [
          {
            search_from_my_products: 0,
            quantity: '2',
            sku: 'TSHIRT-BLK-L',
            print_type_id: 1,
            designs: [
              {
                design_code: 'FRONT',
                width_inches: 10.5,
                height_inches: 12.0,
                placement_sku: 'FRONT-CENTER',
                design_link: 'https://example.com/design.png',
                mockup_link: 'https://example.com/mockup.png'
              }
            ]
          }
        ],
        shipping_address: {
          first_name: 'John',
          last_name: 'Doe',
          address1: '123 Main St',
          address2: 'Apt 4B',
          phone: '5551234567',
          email: 'john@example.com',
          city: 'Mumbai',
          province: 'Maharashtra',
          zip: '400001',
          country_code: 'IN'
        },
        add_ons: [
          {
            box_packing: 0,
            gift_wrap: 0,
            rush_order: 0
          }
        ]
      };

      // Step 1: Get Qikink token
      setResult('Getting Qikink token...');
      const qikinkToken = await getQikinkToken(session.access_token);
      
      // Step 2: Create order
      setResult('Creating order with Qikink...');
      const orderResponse = await createQikinkOrder(
        orderData,
        qikinkToken,
        session.access_token
      );

      setResult(`Order created successfully! Order ID: ${orderResponse.order_id}`);
      
    } catch (err) {
      console.error('Order creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>
        Qikink Order Example
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This example demonstrates how to create a print-on-demand order using the Qikink API.
        You must be logged in to test this functionality.
      </Typography>

      <Button
        variant="contained"
        onClick={handleCreateOrder}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Creating Order...' : 'Create Test Order'}
      </Button>

      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {result}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Required Environment Variables:
        </Typography>
        <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
{`QIKINK_CLIENT_ID=your-client-id
QIKINK_CLIENT_SECRET=your-client-secret
QIKINK_BASE_URL=https://sandbox.qikink.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> This example uses the sandbox environment. 
          For production, change QIKINK_BASE_URL to https://api.qikink.com
        </Typography>
      </Box>
    </Box>
  );
}