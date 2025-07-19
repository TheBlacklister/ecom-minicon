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
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../AuthProvider';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import type { Product } from '@/types';

interface CartItem {
    id: number;
    title: string;
    subtitle: string;
    img: string;
    price: number;
    qty: number;
}

interface CartApiItem {
    product: Product;
    quantity: number;
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

const formatINR = (v:number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function CartPage({ buyNowProductId }: { buyNowProductId?: string | null }) {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [cart, setCart] = useState(DUMMY_CART);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState('card');
    
    // Address management state
    const [openAddModal, setOpenAddModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [newAddr, setNewAddr] = useState(emptyAddress);

    useEffect(() => {
        if (!user) return;
        supabase.auth.getSession().then(({ data: { session } }) => {
            const headers: Record<string, string> = {};
            if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
            
            // Fetch addresses
            fetch('/api/addresses', { headers })
                .then(res => res.ok ? res.json() : [])
                .then((data: Address[]) => {
                    setAddresses(data);
                    if (data.length > 0 && !selectedAddress) {
                        setSelectedAddress(data[0].id);
                    }
                });
            
            if (buyNowProductId) {
                // For "Buy Now" - fetch only the specific product
                fetch(`/api/cart?productId=${buyNowProductId}`, { headers })
                    .then(res => res.ok ? res.json() : null)
                    .then(async (data) => {
                        if (data) {
                            // Product is already in cart, use the existing quantity
                            setCart([{
                                id: data.product.id,
                                title: data.product.title,
                                subtitle: data.product.subtitle,
                                img: data.product.images[0],
                                price: data.product.price_after,
                                qty: data.quantity,
                            }]);
                        } else {
                            // Product not in cart, add it with quantity 1
                            await fetch('/api/cart?buyNow=true', {
                                method: 'POST',
                                headers: { ...headers, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ product_id: Number(buyNowProductId), quantity: 1 })
                            });

                            // Now fetch the cart item
                            const cartRes = await fetch(`/api/cart?productId=${buyNowProductId}`, { headers });
                            const cartData = await cartRes.json();
                            if (cartData) {
                                setCart([{
                                    id: cartData.product.id,
                                    title: cartData.product.title,
                                    subtitle: cartData.product.subtitle,
                                    img: cartData.product.images[0],
                                    price: cartData.product.price_after,
                                    qty: cartData.quantity,
                                }]);
                            }
                        }
                    });
            } else {
                // For regular cart - fetch all cart items
                fetch('/api/cart', { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then((data: CartApiItem[]) => setCart(data.map((item) => ({
                        id: item.product.id,
                        title: item.product.title,
                        subtitle: item.product.subtitle,
                        img: item.product.images[0],
                        price: item.product.price_after,
                        qty: item.quantity,
                    }))))
            }
        });
    }, [user, buyNowProductId, selectedAddress]);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        [cart]
    );
    const shipping = 0;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + taxes;

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

    return (
        // 1. FLEX COLUMN LAYOUT - GROWS AS NEEDED
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: '#f8f9fa',
                fontFamily: 'Futura, sans-serif',
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
                        fontFamily: 'Futura, sans-serif',
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
                        {cart.length === 0 ? (
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
                                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontFamily: 'Futura, sans-serif' }}>
                                    Your cart is empty
                                </Typography>
                                <Button
                                    variant="contained"
                                    href="/products"
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
                                            fontFamily: 'Futura, sans-serif'
                                        }}
                                    >
                                        {buyNowProductId ? 'Product' : `Cart Items (${cart.length})`}
                                    </Typography>

                                    {cart.map((item) => (
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
                                                    src={item.img}
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
                                                                fontFamily: 'Futura, sans-serif'
                                                            }}
                                                        >
                                                            {item.title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mb: 0.5, fontFamily: 'Futura, sans-serif' }}
                                                        >
                                                            {item.subtitle}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ fontFamily: 'Futura, sans-serif' }}
                                                        >
                                                            Qty: {item.qty}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton
                                                        onClick={async () => {
                                                            const { data: { session } } = await supabase.auth.getSession();
                                                            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                                            if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
                                                            await fetch('/api/cart', { method: 'DELETE', headers, body: JSON.stringify({ product_id: item.id }) });
                                                            setCart(cart.filter((i) => i.id !== item.id));
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
                                                        fontFamily: 'Futura, sans-serif'
                                                    }}
                                                >
                                                    {formatINR(item.price * item.qty)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
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
                                            fontFamily: 'Futura, sans-serif'
                                        }}
                                    >
                                        Price Details
                                    </Typography>

                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" sx={{ fontFamily: 'Futura, sans-serif' }}>Subtotal</Typography>
                                            <Typography sx={{ fontFamily: 'Futura, sans-serif' }}>{formatINR(subtotal)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" sx={{ fontFamily: 'Futura, sans-serif' }}>Shipping</Typography>
                                            <Typography sx={{ fontFamily: 'Futura, sans-serif' }}>{shipping === 0 ? 'Free' : formatINR(shipping)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" sx={{ fontFamily: 'Futura, sans-serif' }}>Taxes & Fees</Typography>
                                            <Typography sx={{ fontFamily: 'Futura, sans-serif' }}>{formatINR(taxes)}</Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ fontFamily: 'Futura, sans-serif' }}>Total</Typography>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ fontFamily: 'Futura, sans-serif' }}>
                                                {formatINR(total)}
                                            </Typography>
                                        </Box>
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
                                        fontFamily: 'Futura, sans-serif'
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
                                        fontFamily: 'Futura, sans-serif'
                                    }}
                                >
                                    Add New
                                </Button>
                            </Box>

                            {addresses.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography color="text.secondary" sx={{ fontFamily: 'Futura, sans-serif', mb: 2 }}>
                                        No addresses found. Add your first delivery address.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleOpenAddressModal()}
                                        sx={{ fontFamily: 'Futura, sans-serif' }}
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
                                                fontFamily: 'Futura, sans-serif',
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
                                                    sx={{ fontFamily: 'Futura, sans-serif' }}
                                                >
                                                    {addr.name}
                                                </Typography>
                                                <Typography color="black" sx={{ fontFamily: 'Futura, sans-serif' }}>{addr.line1}</Typography>
                                                <Typography color="black" sx={{ fontFamily: 'Futura, sans-serif' }}>
                                                    {addr.city}, {addr.state} – {addr.pincode}
                                                </Typography>
                                                <Typography color="black" sx={{ fontFamily: 'Futura, sans-serif' }}>Phone: {addr.phone}</Typography>
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
                                                        sx={{ fontFamily: 'Futura, sans-serif' }}
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
                                                        sx={{ fontFamily: 'Futura, sans-serif' }}
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
                                        fontFamily: 'Futura, sans-serif'
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
                                sx={{ fontFamily: 'Futura, sans-serif' }}
                            >
                                <MenuItem value="card" sx={{ fontFamily: 'Futura, sans-serif' }}>Credit/Debit Card</MenuItem>
                                <MenuItem value="upi" sx={{ fontFamily: 'Futura, sans-serif' }}>UPI</MenuItem>
                                <MenuItem value="netbanking" sx={{ fontFamily: 'Futura, sans-serif' }}>Net Banking</MenuItem>
                                <MenuItem value="cod" sx={{ fontFamily: 'Futura, sans-serif' }}>Cash on Delivery</MenuItem>
                            </Select>
                        </Paper>

                        {/* Checkout Button */}
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={cart.length === 0 || !selectedAddress}
                            sx={{
                                py: 1.5,
                                bgcolor: '#fe5000',
                                '&:hover': { bgcolor: '#d64500' },
                                '&.Mui-disabled': {
                                    bgcolor: '#f5f5f5',
                                    color: '#999'
                                },
                                fontFamily: 'Futura, sans-serif'
                            }}
                        >
                            Proceed to Payment ({formatINR(total)})
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
                        fontFamily: 'Futura, sans-serif',
                        width: '100%',
                        boxSizing: 'border-box',
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
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
                                sx: { fontFamily: 'Futura, sans-serif' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: 'Futura, sans-serif' }
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
                                sx: { fontFamily: 'Futura, sans-serif' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: 'Futura, sans-serif' }
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
                                sx: { fontFamily: 'Futura, sans-serif' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: 'Futura, sans-serif' }
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
                                sx: { fontFamily: 'Futura, sans-serif' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: 'Futura, sans-serif' }
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
                                sx: { fontFamily: 'Futura, sans-serif' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: 'Futura, sans-serif' }
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
                                sx: { fontFamily: 'Futura, sans-serif' }
                            }}
                            InputLabelProps={{
                                sx: { fontFamily: 'Futura, sans-serif' }
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button
                        onClick={handleCloseAddressModal}
                        sx={{
                            color: '#666',
                            fontFamily: 'Futura, sans-serif'
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
                            fontFamily: 'Futura, sans-serif'
                        }}
                    >
                        {editId ? 'Update Address' : 'Add Address'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
