'use client'
import { useEffect, useState, useMemo } from 'react'
import Drawer from '@mui/material/Drawer'
import { Box, Typography, IconButton, Button, CircularProgress } from '@mui/material'
import Image from 'next/image'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '../AuthProvider'
import { useCount } from '../CountProvider'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types'
import { getFormattedOptimizedImageSrc } from '@/lib/imageOptimizer'

interface CartItem {
  id: number
  title: string
  subtitle: string | null
  img: string
  price: number
  qty: number
  selected_size: string | null
}

interface CartApiItem {
  product: Product
  quantity: number
  selected_size: string | null
}

const formatINR = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`


export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { updateCartCount } = useCount()
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!open || !user) return

    setLoading(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {}
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`

      fetch('/api/cart', { headers })
        .then(res => res.ok ? res.json() : [])
        .then((data: CartApiItem[]) => setCart(data.map((item) => ({
          id: item.product.id,
          title: item.product.title,
          subtitle: item.product.subtitle,
          img: getFormattedOptimizedImageSrc(item.product.images[0]),
          price: item.product.price_after,
          qty: item.quantity,
          selected_size: item.selected_size,
        })))).finally(() => setLoading(false))
    })
  }, [open, user])

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart])
  const handleIncrease = async (item: CartItem) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/cart', { method: 'POST', headers, body: JSON.stringify({ product_id: item.id, quantity: 1, selected_size: item.selected_size }) })
      if (res.ok) {
        const data = await res.json()
        setCart(cart.map(c => (c.id === item.id && c.selected_size === item.selected_size) ? { ...c, qty: data.quantity } : c))
        updateCartCount() // Update global count
      } else {
        console.error('Failed to increase item quantity:', await res.text())
      }
    } catch (error) {
      console.error('Error increasing item quantity:', error)
    }
  }

  const handleDecrease = async (item: CartItem) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`
      if (item.qty <= 1) {
        const res = await fetch('/api/cart', { method: 'DELETE', headers, body: JSON.stringify({ product_id: item.id, selected_size: item.selected_size }) })
        if (res.ok) {
          setCart(cart.filter(c => !(c.id === item.id && c.selected_size === item.selected_size)))
          updateCartCount() // Update global count
        } else {
          console.error('Failed to delete item from cart:', await res.text())
        }
      } else {
        const res = await fetch('/api/cart', { method: 'PUT', headers, body: JSON.stringify({ product_id: item.id, quantity: item.qty - 1, selected_size: item.selected_size }) })
        if (res.ok) {
          const data = await res.json()
          setCart(cart.map(c => (c.id === item.id && c.selected_size === item.selected_size) ? { ...c, qty: data.quantity } : c))
          updateCartCount() // Update global count
        } else {
          console.error('Failed to decrease item quantity:', await res.text())
        }
      }
    } catch (error) {
      console.error('Error decreasing item quantity:', error)
    }
  }

  const handleDelete = async (item: CartItem) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/cart', { method: 'DELETE', headers, body: JSON.stringify({ product_id: item.id, selected_size: item.selected_size }) })
      if (res.ok) {
        setCart(cart.filter(c => !(c.id === item.id && c.selected_size === item.selected_size)))
        updateCartCount() // Update global count
      } else {
        console.error('Failed to delete item from cart:', await res.text())
      }
    } catch (error) {
      console.error('Error deleting item from cart:', error)
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '80vw', sm: 380 }, maxWidth: 380 } }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontFamily: '"Montserrat", sans-serif' }}>
          My Cart ({cart.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {cart.map(item => (
                <Box key={`${item.id}-${item.selected_size || 'no-size'}`} sx={{ display: 'flex', mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Box sx={{ width: 80, height: 80, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'hidden', mr: 1 }}>
                    <Image src={item.img} alt={item.title} width={80} height={80} style={{ objectFit: 'contain' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontFamily: '"Montserrat", sans-serif' }}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>{item.subtitle}</Typography>
                    {item.selected_size && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Montserrat", sans-serif' }}>Size: {item.selected_size}</Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <IconButton size="small" onClick={() => handleDecrease(item)}><RemoveIcon fontSize="inherit" /></IconButton>
                      <Typography sx={{ mx: 0.5, fontFamily: '"Montserrat", sans-serif' }}>{item.qty}</Typography>
                      <IconButton size="small" onClick={() => handleIncrease(item)}><AddIcon fontSize="inherit" /></IconButton>
                      <IconButton onClick={() => handleDelete(item)} sx={{ ml: 'auto' }}><DeleteOutlineIcon /></IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontFamily: '"Montserrat", sans-serif' }}>Total</Typography>
                <Typography variant="subtitle1" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600 }}>{formatINR(subtotal)}</Typography>
              </Box>
              <Button variant="contained" fullWidth disabled={cart.length === 0}
                sx={{ bgcolor: '#fe5000', '&:hover': { bgcolor: '#d64500' }, fontFamily: '"Montserrat", sans-serif' }}
                onClick={() => { router.push('/cart'); onClose(); }}>
                Proceed to Checkout
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}
