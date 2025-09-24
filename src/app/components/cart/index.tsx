'use client';
import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Box,
    Typography,
    Button,
    Paper,
    MenuItem,
    Select,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Container,
    Divider,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Skeleton,
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../AuthProvider';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Product } from '@/types';
import { getFormattedOptimizedImageSrc } from '@/lib/imageOptimizer';

interface CartItem {
    id: number;
    title: string;
    subtitle: string | null;
    img: string;
    price: number;
    qty: number;
    selected_size: string | null;
}

interface CartApiItem {
    product: Product;
    quantity: number;
    selected_size: string | null;
}

interface Address {
    id: string;
    name: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
}

const DUMMY_CART: CartItem[] = [];

const emptyAddress: Address = {
    id: '',
    name: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
};

const formatINR = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Loading component
const LoadingScreen = () => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: '#f8f9fa',
            fontFamily: '"Montserrat", sans-serif',
        }}
    >
        <CircularProgress 
            size={60} 
            sx={{ 
                color: '#fe5000',
                mb: 3 
            }} 
        />
        <Typography
            variant="h6"
            sx={{
                color: '#1a1a1a',
                fontWeight: 600,
                fontFamily: '"Montserrat", sans-serif',
                textAlign: 'center',
            }}
        >
            Loading your cart...
        </Typography>
        <Typography
            variant="body2"
            sx={{
                color: '#666',
                mt: 1,
                fontFamily: '"Montserrat", sans-serif',
                textAlign: 'center',
            }}
        >
            Please wait while we fetch your items
        </Typography>
    </Box>
);

// Skeleton components for loading states
const CartItemSkeleton = () => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            mb: 3,
            pb: 3,
            borderBottom: '1px solid #eee',
            width: '100%',
        }}
    >
        <Skeleton
            variant="rectangular"
            width={120}
            height={120}
            sx={{ 
                borderRadius: 2,
                mb: { xs: 2, sm: 0 },
                mr: { sm: 3 },
            }}
        />
        <Box sx={{ flex: 1, width: '100%' }}>
            <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="30%" height={20} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="25%" height={24} />
        </Box>
    </Box>
);

const AddressSkeleton = () => (
    <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={60} height={32} />
                <Skeleton variant="rectangular" width={60} height={32} />
            </Box>
        </CardContent>
    </Card>
);

export default function CartPage({ buyNowProductId, couponCode }: { buyNowProductId?: string | null, couponCode?: string | null }) {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [cart, setCart] = useState(DUMMY_CART);
    const [cartWithProductDetails, setCartWithProductDetails] = useState<CartApiItem[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState('cod');

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isCartLoading, setIsCartLoading] = useState(true);
    const [isAddressesLoading, setIsAddressesLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Address management state
    const [openAddModal, setOpenAddModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [newAddr, setNewAddr] = useState(emptyAddress);

    // Coupon state
    const [selectedCoupon, setSelectedCoupon] = useState<{code: string, discount: number, description: string, type: string, minOrder?: number} | null>(null);

    // Order success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState<{orderId: string, total: number} | null>(null);

    // Coupon data
    const availableCoupons = useMemo(() => [
        {
            code: 'FLAT500',
            discount: 500,
            description: 'Get flat ₹500 off on orders above ₹2000',
            minOrder: 2000,
            type: 'flat_discount'
        }
    ], []);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            setIsCartLoading(true);
            setIsAddressesLoading(true);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                const headers: Record<string, string> = {};
                if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

                // Load addresses and cart data in parallel
                const [addressesRes, cartRes] = await Promise.allSettled([
                    fetch('/api/addresses', { headers }),
                    buyNowProductId 
                        ? fetch(`/api/cart?productId=${buyNowProductId}`, { headers })
                        : fetch('/api/cart', { headers })
                ]);

                // Handle addresses
                if (addressesRes.status === 'fulfilled' && addressesRes.value.ok) {
                    const addressesData = await addressesRes.value.json();
                    setAddresses(addressesData);
                    if (addressesData.length > 0 && !selectedAddress) {
                        setSelectedAddress(addressesData[0].id);
                    }
                }
                setIsAddressesLoading(false);

                // Handle cart data
                if (cartRes.status === 'fulfilled') {
                    if (buyNowProductId) {
                        // For "Buy Now" - fetch only the specific product
                        const cartData = await cartRes.value.json();
                        if (cartData) {
                            // Product is already in cart, use the existing quantity
                            setCartWithProductDetails([cartData]);
                            setCart([{
                                id: cartData.product.id,
                                title: cartData.product.title,
                                subtitle: cartData.product.subtitle,
                                img: getFormattedOptimizedImageSrc(cartData.product.images[0]),
                                price: cartData.product.price_after,
                                qty: cartData.quantity,
                                selected_size: cartData.selected_size,
                            }]);
                        } else {
                            // Product not in cart, add it with quantity 1
                            await fetch('/api/cart?buyNow=true', {
                                method: 'POST',
                                headers: { ...headers, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ product_id: Number(buyNowProductId), quantity: 1 })
                            });

                            // Now fetch the cart item
                            const newCartRes = await fetch(`/api/cart?productId=${buyNowProductId}`, { headers });
                            const newCartData = await newCartRes.json();
                            if (newCartData) {
                                setCartWithProductDetails([newCartData]);
                                setCart([{
                                    id: newCartData.product.id,
                                    title: newCartData.product.title,
                                    subtitle: newCartData.product.subtitle,
                                    img: getFormattedOptimizedImageSrc(newCartData.product.images[0]),
                                    price: newCartData.product.price_after,
                                    qty: newCartData.quantity,
                                    selected_size: newCartData.selected_size,
                                }]);
                            }
                        }
                    } else {
                        // For regular cart - fetch all cart items
                        if (cartRes.value.ok) {
                            const cartData = await cartRes.value.json();
                            console.log('Cart items fetched:', cartData);
                            setCartWithProductDetails(cartData);
                            setCart(cartData.map((item: CartApiItem) => ({
                                id: item.product.id,
                                title: item.product.title,
                                subtitle: item.product.subtitle,
                                img: getFormattedOptimizedImageSrc(item.product.images[0]),
                                price: item.product.price_after,
                                qty: item.quantity,
                                selected_size: item.selected_size,
                            })));
                        }
                    }
                }
                setIsCartLoading(false);
            } catch (error) {
                console.error('Error loading data:', error);
                setIsCartLoading(false);
                setIsAddressesLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, buyNowProductId, selectedAddress]);

    // Auto-apply coupon from URL params
    useEffect(() => {
        if (couponCode && availableCoupons.length > 0) {
            const matchingCoupon = availableCoupons.find(coupon => coupon.code === couponCode);
            if (matchingCoupon && !selectedCoupon) {
                setSelectedCoupon(matchingCoupon);
            }
        }
    }, [couponCode, availableCoupons, selectedCoupon]);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        [cart]
    );
    const shipping = 0;
    const taxes = Math.round(subtotal * 0.05);
    
    // Coupon calculation
    const couponDiscount = useMemo(() => {
        if (!selectedCoupon) return 0;
        
        // Check if minimum order requirement is met
        if (selectedCoupon.minOrder && subtotal < selectedCoupon.minOrder) {
            return 0;
        }
        
        return selectedCoupon.discount;
    }, [selectedCoupon, subtotal]);
    
    const total = subtotal + shipping + taxes - couponDiscount;

    // Address management functions
    function handleAddrChange(e: React.ChangeEvent<HTMLInputElement>) {
        setNewAddr({ ...newAddr, [e.target.name]: e.target.value });
    }

    function handleOpenAddressModal(address?: Address) {
        if (address) {
            setNewAddr(address);
            setEditId(address.id);
        } else {
            setNewAddr(emptyAddress);
            setEditId(null);
        }
        setOpenAddModal(true);
    }

    function handleCloseAddressModal() {
        setOpenAddModal(false);
        setEditId(null);
        setNewAddr(emptyAddress);
    }

    async function handleAddAddress() {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

        if (editId) {
            // Update existing address
            const res = await fetch('/api/addresses', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...newAddr, id: editId })
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(addresses.map(addr => addr.id === editId ? data : addr));
                if (selectedAddress === editId) {
                    setSelectedAddress(data.id);
                }
            }
        } else {
            // Add new address
            const res = await fetch('/api/addresses', {
                method: 'POST',
                headers,
                body: JSON.stringify(newAddr)
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses([data, ...addresses]);
                if (!selectedAddress) {
                    setSelectedAddress(data.id);
                }
            }
        }
        handleCloseAddressModal();
    }

    async function handleDeleteAddress(id: string) {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

        const res = await fetch('/api/addresses', {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            setAddresses(addresses.filter(addr => addr.id !== id));
            if (selectedAddress === id) {
                const remainingAddresses = addresses.filter(addr => addr.id !== id);
                setSelectedAddress(remainingAddresses.length > 0 ? remainingAddresses[0].id : '');
            }
        }
    }

    const canAdd = newAddr.name.trim() && newAddr.line1.trim() && newAddr.city.trim() &&
        newAddr.state.trim() && newAddr.pincode.trim() && newAddr.phone.trim();

    // Coupon handlers
    const handleCouponSelect = (coupon: typeof availableCoupons[0]) => {
        if (selectedCoupon?.code === coupon.code) {
            setSelectedCoupon(null); // Deselect if already selected
        } else {
            setSelectedCoupon(coupon);
        }
    };

    // Check if coupon is applicable
    const isCouponApplicable = (coupon: typeof availableCoupons[0]) => {
        if (!coupon.minOrder) return true;
        return subtotal >= coupon.minOrder;
    };

    // Handle proceed to payment
    const handleProceedToPayment = async () => {
        if (isPlacingOrder) return; // Prevent double clicks

        setIsPlacingOrder(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

            const selectedAddressData = addresses.find(addr => addr.id === selectedAddress);
console.log('cartWithProductDetails',cartWithProductDetails)
            const payload = {
                orderId: `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                cartItems: cartWithProductDetails,
                selectedAddress: selectedAddressData,
                paymentMode,
                subtotal,
                shipping,
                taxes,
                couponDiscount,
                total: Math.max(0, total),
                selectedCoupon,
                userEmail: user?.email
            };

            console.log('Calling generateToken API with payload:', payload);

            const response = await fetch('/api/generateToken', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('generateToken API response:', result);

                // If order was created successfully, save it to our database
                if (result.success && result.order && result.order.order_id) {
                    try {
                        const orderPayload = {
                            qikink_order_id: result.order.order_id,
                            order_number: payload.orderId,
                            payment_mode: paymentMode,
                            total_amount: payload.total,
                            subtotal: payload.subtotal,
                            shipping: payload.shipping,
                            taxes: payload.taxes,
                            coupon_discount: payload.couponDiscount,
                            coupon_code: selectedCoupon?.code || null,
                            shipping_address: selectedAddressData,
                            cart_items: cartWithProductDetails
                        };

                        const orderResponse = await fetch('/api/orders', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(orderPayload)
                        });

                        if (orderResponse.ok) {
                            const orderResult = await orderResponse.json();
                            console.log('Order saved to database:', orderResult);

                            // Clear the cart after successful order placement
                            if (!buyNowProductId) {
                                // For regular cart, clear all items
                                const clearCartResponse = await fetch('/api/cart', {
                                    method: 'DELETE',
                                    headers,
                                    body: JSON.stringify({ clear_all: true })
                                });

                                if (clearCartResponse.ok) {
                                    setCart([]);
                                    setCartWithProductDetails([]);
                                }
                            }

                            // Show success modal instead of alert
                            setOrderDetails({
                                orderId: result.order.order_id,
                                total: payload.total
                            });
                            setShowSuccessModal(true);

                        } else {
                            console.error('Failed to save order to database:', await orderResponse.text());
                            alert('Failed to save order. Please try again.');
                        }
                    } catch (error) {
                        console.error('Error saving order to database:', error);
                        alert('An error occurred while processing your order. Please try again.');
                    }
                } else {
                    alert('Failed to place order. Please try again.');
                }
            } else {
                console.error('generateToken API failed:', await response.text());
                alert('Failed to place order. Please try again.');
            }
        } catch (error) {
            console.error('Error calling generateToken API:', error);
            alert('An error occurred while processing your order. Please try again.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Show loading screen while initial data is loading
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        // 1. FLEX COLUMN LAYOUT - GROWS AS NEEDED
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: '#f8f9fa',
                fontFamily: '"Montserrat", sans-serif ',
            }}
        >
            {/* 2. MAIN CONTENT GROWS - px: 0 ensures no double padding */}
            <Container
                maxWidth="md"
                sx={{
                    flex: '1 0 auto',
                    py: { xs: 2, md: 4, lg: 4 },
                    px: { xs: 1, sm: 2, md: 4, lg: 4 },
                    boxSizing: 'border-box',
                    width: '100%',
                    minWidth: 0,
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        mb: { xs: 2, md: 4, lg: 4 },
                        color: '#1a1a1a',
                        fontSize: { xs: '1.5rem', md: '2rem', lg: '2rem' },
                        fontFamily: '"Montserrat", sans-serif ',
                        wordBreak: 'break-word',
                    }}
                >
                    {buyNowProductId ? 'Buy Now' : 'Shopping Cart'}
                </Typography>

                <Stack
                    direction={{ xs: 'column', md: 'row', lg: 'row' }}
                    spacing={{ xs: 2, md: 4, lg: 4 }}
                    alignItems="flex-start"
                    sx={{ width: '100%', minWidth: 0, flexGrow: 1 }}
                >
                    {/* Left Column - Cart Items */}
                    <Box sx={{
                        flex: 1,
                        width: '100%',
                        minWidth: 0,
                        mb: { xs: 2, md: 0, lg: 0 },
                        boxSizing: 'border-box',
                    }}>
                        {isCartLoading ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 1.5, md: 3, lg: 3 },
                                    mb: 2,
                                    bgcolor: 'white',
                                    borderRadius: 2,
                                    width: '100%',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 2,
                                        color: '#1a1a1a',
                                        fontWeight: 600,
                                        fontFamily: '"Montserrat", sans-serif '
                                    }}
                                >
                                    {buyNowProductId ? 'Product' : 'Cart Items'}
                                </Typography>
                                <CartItemSkeleton />
                                <CartItemSkeleton />
                            </Paper>
                        ) : cart.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    bgcolor: 'white',
                                    borderRadius: 2
                                }}
                            >
                                <ShoppingBagOutlinedIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                                    Your cart is empty
                                </Typography>
                                <Button
                                    variant="contained"
                                    href="/categories/shop-by/new-arrivals"
                                    sx={{
                                        mt: 2,
                                        bgcolor: '#fe5000',
                                        '&:hover': { bgcolor: '#d64500' }
                                    }}
                                >
                                    Continue Shopping
                                </Button>
                            </Paper>
                        ) : (
                            <>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 1.5, md: 3, lg: 3 },
                                        mb: 2,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            mb: 2,
                                            color: '#1a1a1a',
                                            fontWeight: 600,
                                            fontFamily: '"Montserrat", sans-serif '
                                        }}
                                    >
                                        {buyNowProductId ? 'Product' : `Cart Items (${cart.length})`}
                                    </Typography>

                                    {cart.map((item) => {
                                        console.log('Cart item:', item);
                                        return (
                                        <Box
                                            key={item.id}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'center', sm: 'flex-start' },
                                                mb: 3,
                                                pb: 3,
                                                borderBottom: '1px solid #eee',
                                                '&:last-child': {
                                                    mb: 0,
                                                    pb: 0,
                                                    borderBottom: 'none'
                                                },
                                                width: '100%',
                                                minWidth: 0,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: { xs: '100%', sm: 120 },
                                                    maxWidth: 120,
                                                    height: { xs: 140, sm: 120 },
                                                    bgcolor: '#f8f9fa',
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    mb: { xs: 2, sm: 0 },
                                                    mr: { sm: 3 },
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Image
                                                    src={
                                                        item.img
                                                            .replace(/\\/g, '/')            // Replace all backslashes with forward slashes
                                                            .replace(/^\/?public\//, '')    // Remove leading 'public/' or '/public/'
                                                            .replace(/^\/+/, '/')           // Ensure single leading slash
                                                            .replace(/\/{2,}/g, '/')        // Replace multiple slashes with a single slash
                                                    }
                                                    alt={item.title}
                                                    width={120}
                                                    height={120}
                                                    style={{
                                                        objectFit: 'contain',
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'block',
                                                    }}
                                                />

                                            </Box>

                                            <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    mb: 1
                                                }}>
                                                    <Box>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: '#1a1a1a',
                                                                mb: 0.5,
                                                                fontFamily: '"Montserrat", sans-serif '
                                                            }}
                                                        >
                                                            {item.title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mb: 0.5, fontFamily: '"Montserrat", sans-serif ' }}
                                                        >
                                                            {item.subtitle}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ fontFamily: '"Montserrat", sans-serif ' }}
                                                        >
                                                            Size: {item.selected_size || 'N/A'}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ fontFamily: '"Montserrat", sans-serif ' }}
                                                        >
                                                            Qty: {item.qty}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton
                                                        onClick={async () => {
                                                            const { data: { session } } = await supabase.auth.getSession();
                                                            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                                            if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
                                                            await fetch('/api/cart', { method: 'DELETE', headers, body: JSON.stringify({ product_id: item.id, selected_size: item.selected_size }) });
                                                            setCart(cart.filter((i) => !(i.id === item.id && i.selected_size === item.selected_size)));
                                                        }}
                                                        sx={{
                                                            color: '#666',
                                                            '&:hover': { color: '#fe5000' }
                                                        }}
                                                    >
                                                        <DeleteOutlineIcon />
                                                    </IconButton>
                                                </Box>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: '#1a1a1a',
                                                        mt: 1,
                                                        fontFamily: '"Montserrat", sans-serif '
                                                    }}
                                                >
                                                    {formatINR(item.price * item.qty)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                    })}
                                </Paper>

                                {/* Coupon Section */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 1.5, md: 3, lg: 3 },
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        mt: 2,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            mb: 2,
                                            color: '#1a1a1a',
                                            fontWeight: 600,
                                            fontFamily: '"Montserrat", sans-serif'
                                        }}
                                    >
                                        Available Offers
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {availableCoupons.map((coupon) => {
                                            const isApplicable = isCouponApplicable(coupon);
                                            const isSelected = selectedCoupon?.code === coupon.code;
                                            
                                            return (
                                                <Box
                                                    key={coupon.code}
                                                    onClick={() => isApplicable && handleCouponSelect(coupon)}
                                                    sx={{
                                                        border: isSelected ? '2px solid #fe5000' : '1px solid #e0e0e0',
                                                        borderRadius: 2,
                                                        p: { xs: 1.5, sm: 2 },
                                                        cursor: isApplicable ? 'pointer' : 'not-allowed',
                                                        backgroundColor: isSelected ? '#fff5f5' : isApplicable ? 'white' : '#f5f5f5',
                                                        opacity: isApplicable ? 1 : 0.6,
                                                        transition: 'all 0.3s ease',
                                                        '&:hover': isApplicable ? {
                                                            borderColor: isSelected ? '#fe5000' : '#666',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        } : {},
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'flex-start', 
                                                        mb: 1,
                                                        flexDirection: { xs: 'column', sm: 'row' },
                                                        gap: { xs: 1, sm: 0 }
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box
                                                                sx={{
                                                                    width: 18,
                                                                    height: 18,
                                                                    border: isSelected ? '2px solid #fe5000' : '2px solid #ccc',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: isSelected ? '#fe5000' : 'transparent',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                            >
                                                                {isSelected && (
                                                                    <Box
                                                                        sx={{
                                                                            width: 8,
                                                                            height: 8,
                                                                            backgroundColor: 'white',
                                                                            borderRadius: '50%'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={600}
                                                                sx={{
                                                                    fontFamily: '"Montserrat", sans-serif',
                                                                    color: isSelected ? '#fe5000' : 'black',
                                                                    backgroundColor: '#f0f0f0',
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderRadius: 1,
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                {coupon.code}
                                                            </Typography>
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={700}
                                                            sx={{
                                                                fontFamily: '"Montserrat", sans-serif',
                                                                color: '#fe5000',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            Save ₹{coupon.discount}
                                                        </Typography>
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontFamily: '"Montserrat", sans-serif',
                                                            color: isApplicable ? 'black' : '#666',
                                                            mb: 0.5,
                                                            fontSize: { xs: '13px', sm: '14px' }
                                                        }}
                                                    >
                                                        {coupon.description}
                                                    </Typography>
                                                    {coupon.minOrder && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: '"Montserrat", sans-serif',
                                                                color: '#666',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            {isApplicable 
                                                                ? `✓ Minimum order requirement met`
                                                                : `Minimum order: ₹${coupon.minOrder} (Current: ₹${subtotal})`
                                                            }
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Paper>

                                {/* Price Summary */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 1.5, md: 3, lg: 3 },
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        mt: 2,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            mb: 2,
                                            color: '#1a1a1a',
                                            fontWeight: 600,
                                            fontFamily: '"Montserrat", sans-serif '
                                        }}
                                    >
                                        Price Details
                                    </Typography>

                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Subtotal</Typography>
                                            <Typography sx={{ fontFamily: '"Montserrat", sans-serif ' }}>{formatINR(subtotal)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Shipping</Typography>
                                            <Typography sx={{ fontFamily: '"Montserrat", sans-serif ' }}>{shipping === 0 ? 'Free' : formatINR(shipping)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Taxes & Fees</Typography>
                                            <Typography sx={{ fontFamily: '"Montserrat", sans-serif ' }}>{formatINR(taxes)}</Typography>
                                        </Box>
                                        {selectedCoupon && couponDiscount > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ fontFamily: '"Montserrat", sans-serif', color: '#fe5000' }}>
                                                    Coupon ({selectedCoupon.code})
                                                </Typography>
                                                <Typography sx={{ fontFamily: '"Montserrat", sans-serif', color: '#fe5000' }}>
                                                    -{formatINR(couponDiscount)}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Total</Typography>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                                                {formatINR(Math.max(0, total))}
                                            </Typography>
                                        </Box>
                                        {selectedCoupon && couponDiscount > 0 && (
                                            <Box sx={{ 
                                                backgroundColor: '#fff5f5', 
                                                border: '1px solid #fe5000', 
                                                borderRadius: 1, 
                                                p: 1,
                                                mt: 1
                                            }}>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        fontFamily: '"Montserrat", sans-serif', 
                                                        color: '#fe5000',
                                                        textAlign: 'center',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    🎉 You saved {formatINR(couponDiscount)} with {selectedCoupon.code}!
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </Paper>
                            </>
                        )}
                    </Box>

                    {/* Right Column - Address & Payment */}
                    <Box sx={{
                        width: { xs: '100%', md: 400, lg: 400 },
                        minWidth: 0,
                        boxSizing: 'border-box',
                    }}>
                        {/* Address Selection */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.5, md: 3, lg: 3 },
                                mb: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#1a1a1a',
                                        fontWeight: 600,
                                        fontFamily: '"Montserrat", sans-serif '
                                    }}
                                >
                                    Delivery Address
                                </Typography>
                                <Button
                                    startIcon={<LocationOnOutlinedIcon />}
                                    onClick={() => handleOpenAddressModal()}
                                    sx={{
                                        color: '#fe5000',
                                        '&:hover': { bgcolor: 'rgba(254, 80, 0, 0.04)' },
                                        fontFamily: '"Montserrat", sans-serif '
                                    }}
                                >
                                    Add New
                                </Button>
                            </Box>

                            {isAddressesLoading ? (
                                <>
                                    <AddressSkeleton />
                                    <AddressSkeleton />
                                </>
                            ) : addresses.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif ', mb: 2 }}>
                                        No addresses found. Add your first delivery address.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleOpenAddressModal()}
                                        sx={{ fontFamily: '"Montserrat", sans-serif ' }}
                                    >
                                        Add Address
                                    </Button>
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {addresses.map((addr) => (
                                        <Card
                                            key={addr.id}
                                            variant="outlined"
                                            sx={{
                                                backgroundColor: selectedAddress === addr.id ? 'rgba(254, 80, 0, 0.04)' : '#fff',
                                                border: selectedAddress === addr.id ? '2px solid #fe5000' : '1px solid #e0e0e0',
                                                fontFamily: '"Montserrat", sans-serif ',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    borderColor: '#fe5000',
                                                    backgroundColor: 'rgba(254, 80, 0, 0.02)'
                                                }
                                            }}
                                            onClick={() => setSelectedAddress(addr.id)}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                <Typography
                                                    fontWeight={600}
                                                    color="black"
                                                    gutterBottom
                                                    variant={isMobile ? "subtitle1" : "h6"}
                                                    sx={{ fontFamily: '"Montserrat", sans-serif ' }}
                                                >
                                                    {addr.name}
                                                </Typography>
                                                <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>{addr.line1}</Typography>
                                                <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                                                    {addr.city}, {addr.state} – {addr.pincode}
                                                </Typography>
                                                <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Phone: {addr.phone}</Typography>
                                                <Divider sx={{ my: 1 }} />
                                                <Stack
                                                    direction={{ xs: 'column', sm: 'row' }}
                                                    spacing={1}
                                                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                                                >
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenAddressModal(addr);
                                                        }}
                                                        sx={{ fontFamily: '"Montserrat", sans-serif ' }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAddress(addr.id);
                                                        }}
                                                        sx={{ fontFamily: '"Montserrat", sans-serif ' }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </Paper>

                        {/* Payment Method */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.5, md: 3, lg: 3 },
                                mb: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PaymentOutlinedIcon sx={{ mr: 1, color: '#666' }} />
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#1a1a1a',
                                        fontWeight: 600,
                                        fontFamily: '"Montserrat", sans-serif '
                                    }}
                                >
                                    Payment Method
                                </Typography>
                            </Box>

                            <Select
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                fullWidth
                                size="small"
                                sx={{ fontFamily: '"Montserrat", sans-serif ' }}
                            >
                                <MenuItem value="card" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Credit/Debit Card</MenuItem>
                                <MenuItem value="upi" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>UPI</MenuItem>
                                <MenuItem value="netbanking" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Net Banking</MenuItem>
                                <MenuItem value="cod" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Cash on Delivery</MenuItem>
                            </Select>
                        </Paper>

                        {/* Checkout Button */}
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={cart.length === 0 || !selectedAddress || isCartLoading || isAddressesLoading || isPlacingOrder}
                            onClick={handleProceedToPayment}
                            sx={{
                                py: 1.5,
                                bgcolor: '#fe5000',
                                '&:hover': { bgcolor: '#d64500' },
                                '&.Mui-disabled': {
                                    bgcolor: '#f5f5f5',
                                    color: '#999'
                                },
                                fontFamily: '"Montserrat", sans-serif ',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            {isPlacingOrder && <CircularProgress size={20} sx={{ color: 'white' }} />}
                            {isPlacingOrder ? 'Placing order...' : 'Place order'}
                        </Button>
                    </Box>
                </Stack>
            </Container>

            {/* Add/Edit Address Modal */}
            <Dialog
                open={openAddModal}
                onClose={handleCloseAddressModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        p: 1,
                        fontFamily: '"Montserrat", sans-serif ',
                        width: '100%',
                        boxSizing: 'border-box',
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontFamily: '"Montserrat", sans-serif ' }}>
                    {editId ? 'Edit Address' : 'Add New Address'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Full Name"
                            name="name"
                            value={newAddr.name}
                            onChange={handleAddrChange}
                            required
                            fullWidth
                            autoFocus
                            InputProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                        />
                        <TextField
                            label="Address Line"
                            name="line1"
                            value={newAddr.line1}
                            onChange={handleAddrChange}
                            required
                            fullWidth
                            InputProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                        />
                        <TextField
                            label="City"
                            name="city"
                            value={newAddr.city}
                            onChange={handleAddrChange}
                            required
                            fullWidth
                            InputProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                        />
                        <TextField
                            label="State"
                            name="state"
                            value={newAddr.state}
                            onChange={handleAddrChange}
                            required
                            fullWidth
                            InputProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                        />
                        <TextField
                            label="Pincode"
                            name="pincode"
                            value={newAddr.pincode}
                            onChange={handleAddrChange}
                            required
                            fullWidth
                            InputProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                        />
                        <TextField
                            label="Phone"
                            name="phone"
                            value={newAddr.phone}
                            onChange={handleAddrChange}
                            required
                            fullWidth
                            InputProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: '"Montserrat", sans-serif ' }
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button
                        onClick={handleCloseAddressModal}
                        sx={{
                            color: '#666',
                            fontFamily: '"Montserrat", sans-serif '
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddAddress}
                        disabled={!canAdd}
                        sx={{
                            bgcolor: '#fe5000',
                            color: '#fff',
                            '&:hover': { bgcolor: '#d64500' },
                            fontFamily: '"Montserrat", sans-serif '
                        }}
                    >
                        {editId ? 'Update Address' : 'Add Address'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Order Success Modal */}
            <Dialog
                open={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 2,
                        fontFamily: '"Montserrat", sans-serif',
                        textAlign: 'center'
                    }
                }}
            >
                <DialogContent sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: '#4caf50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                animation: 'scale 0.5s ease-in-out'
                            }}
                        >
                            <CheckCircleIcon sx={{ fontSize: 50, color: 'white' }} />
                        </Box>

                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: '#1a1a1a',
                                mb: 2,
                                fontFamily: '"Montserrat", sans-serif'
                            }}
                        >
                            Order Placed Successfully! 🎉
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: '#666',
                                mb: 3,
                                fontFamily: '"Montserrat", sans-serif'
                            }}
                        >
                            Thank you for your order. We&apos;ll send you a confirmation email shortly.
                        </Typography>

                        {orderDetails && (
                            <Box
                                sx={{
                                    bgcolor: '#f8f9fa',
                                    borderRadius: 2,
                                    p: 2,
                                    mb: 3,
                                    width: '100%'
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#666',
                                        fontFamily: '"Montserrat", sans-serif',
                                        mb: 0.5
                                    }}
                                >
                                    Order ID
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#1a1a1a',
                                        fontFamily: '"Montserrat", sans-serif',
                                        mb: 1
                                    }}
                                >
                                    {orderDetails.orderId}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#666',
                                        fontFamily: '"Montserrat", sans-serif',
                                        mb: 0.5
                                    }}
                                >
                                    Total Amount
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#fe5000',
                                        fontFamily: '"Montserrat", sans-serif'
                                    }}
                                >
                                    {formatINR(orderDetails.total)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShowSuccessModal(false);
                            window.location.href = '/categories/shop-by/new-arrivals';
                        }}
                        sx={{
                            px: 4,
                            py: 1.5,
                            bgcolor: '#fe5000',
                            '&:hover': { bgcolor: '#d64500' },
                            fontFamily: '"Montserrat", sans-serif',
                            fontWeight: 600,
                            borderRadius: 2
                        }}
                    >
                        Continue Shopping
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
