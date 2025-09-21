'use client';
import { Card, CardContent, Typography, Button, Stack, useTheme, useMediaQuery, Box, CircularProgress, Alert, Chip, Divider } from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function OrdersSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myQikinkOrderIds, setMyQikinkOrderIds] = useState<number[]>([]);

  const fetchMyOrders = async () => {
    try {
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch('/api/getMyOrders', { headers });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch my orders:', errorData.error);
        return [];
      }

      const data = await response.json();
      console.log('My Qikink Order IDs from Supabase:', data.qikinkOrderIds);

      setMyQikinkOrderIds(data.qikinkOrderIds || []);
      return data.qikinkOrderIds || [];
    } catch (err) {
      console.error('Error fetching my orders:', err);
      return [];
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // First fetch user's qikink_order_id values from Supabase
      const myOrderIds = await fetchMyOrders();

      const response = await fetch('/api/qikinkOrders');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      console.log('Orders data:', data);

      // Extract order_id values from the response and store in an array
      let orderIds: number[] = [];
      if (data.success && data.orders && Array.isArray(data.orders)) {
        orderIds = data.orders
          .map((order: any) => order.order_id)
          .filter((id: any) => id !== null && id !== undefined);
      }
      console.log('Extracted Order IDs:', orderIds);
      console.log('My Qikink Order IDs from Supabase:', myOrderIds);
      console.log('Comparison - Order IDs that belong to me:', orderIds.filter(id => myOrderIds.includes(id)));

      // Handle the response structure from Qikink API and filter by user's orders
      if (data.success && data.orders) {
        let allOrders = [];
        // If orders is an array, use it directly
        if (Array.isArray(data.orders)) {
          allOrders = data.orders;
        } else if (data.orders.data && Array.isArray(data.orders.data)) {
          // If orders has a data property with array
          allOrders = data.orders.data;
        }

        // Filter orders to only include those that belong to the user
        const userOrders = allOrders.filter((order: any) =>
          myOrderIds.includes(order.order_id)
        );

        console.log(`Filtered to ${userOrders.length} orders out of ${allOrders.length} total orders`);
        setOrders(userOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#4caf50';
      case 'shipped':
        return '#2196f3';
      case 'processing':
        return '#ff9800';
      case 'cancelled':
      case 'on hold':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const isCancelledOrder = (orderNumber: string) => {
    return orderNumber?.toLowerCase().includes('cancelled');
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0' : numPrice.toString();
  };

  const getTotalDesigns = (lineItems: any['line_items']) => {
    return lineItems.reduce((total:any, item:any) => {
      return total + (item.designs?.length || 0);
    }, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
        {error}
      </Alert>
    );
  }

  return (
    <>
      {orders.length === 0 ? (
        <Typography sx={{ fontFamily: '"Montserrat", sans-serif' }}>No past orders found.</Typography>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => (
            <Card key={order.order_id} variant="outlined" sx={{
              backgroundColor: '#fff',
              fontFamily: '"Montserrat", sans-serif',
              width: '100%',
              opacity: isCancelledOrder(order.number) ? 0.7 : 1
            }}>
              <CardContent>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {/* Order Header */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 1
                  }}>
                    <Box>
                      <Typography
                        fontWeight={600}
                        color="black"
                        variant={isMobile ? "subtitle1" : "h6"}
                        sx={{ fontFamily: '"Montserrat", sans-serif' }}
                      >
                        {order.number}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: '"Montserrat", sans-serif' }}
                      >
                        {formatDate(order.created_on)}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  <Divider />

                  {/* Order Details Grid */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(4, 1fr)'
                    },
                    gap: 2
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        Items
                      </Typography>
                      <Typography fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        {order.line_items?.length || 0} item{(order.line_items?.length || 0) !== 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        Total Amount
                      </Typography>
                      <Typography fontWeight={700} color="primary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        ₹ {formatPrice(order.total_order_value)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        Payment
                      </Typography>
                      <Typography sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        {order.payment_type}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        Designs
                      </Typography>
                      <Typography sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        {getTotalDesigns(order.line_items)} design{getTotalDesigns(order.line_items) !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Shipping Info */}
                  {order.shipping && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        Shipping To
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                        {order.shipping.first_name} {order.shipping.last_name}, {order.shipping.city} - {order.shipping.zip}
                      </Typography>
                      {order.shipping.awb && (
                        <Typography variant="caption" color="primary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                          Tracking: {order.shipping.awb}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        fontFamily: '"Montserrat", sans-serif'
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}