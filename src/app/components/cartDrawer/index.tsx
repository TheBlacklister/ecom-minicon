'use client'
import { useEffect, useState, useMemo } from 'react'
import Drawer from '@mui/material/Drawer'
import { Box, Typography, IconButton, Button } from '@mui/material'
import Image from 'next/image'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '../AuthProvider'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types'

interface CartItem {
  id: number
  title: string
  subtitle: string
  img: string
  price: number
  qty: number
}

interface CartApiItem {
  product: Product
  quantity: number
}

const formatINR = (v:number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function CartDrawer({ open, onClose }:{ open:boolean; onClose:()=>void }) {
  const { user } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    if (!open || !user) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {}
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`
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
    })
  }, [open, user])

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart])

  const handleIncrease = async (id:number) => {
    const item = cart.find(i => i.id === id)
    if (!item) return
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch('/api/cart', { method: 'POST', headers, body: JSON.stringify({ product_id: id, quantity: 1 }) })
    if (res.ok) {
      const data = await res.json()
      setCart(cart.map(c => c.id === id ? { ...c, qty: data.quantity } : c))
    }
  }

  const handleDecrease = async (id:number) => {
    const item = cart.find(i => i.id === id)
    if (!item) return
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`
    if (item.qty <= 1) {
      await fetch('/api/cart', { method: 'DELETE', headers, body: JSON.stringify({ product_id: id }) })
      setCart(cart.filter(c => c.id !== id))
    } else {
      const res = await fetch('/api/cart', { method: 'PUT', headers, body: JSON.stringify({ product_id: id, quantity: item.qty - 1 }) })
      if (res.ok) {
        const data = await res.json()
        setCart(cart.map(c => c.id === id ? { ...c, qty: data.quantity } : c))
      }
    }
  }

  const handleDelete = async (id:number) => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`
    await fetch('/api/cart', { method: 'DELETE', headers, body: JSON.stringify({ product_id: id }) })
    setCart(cart.filter(c => c.id !== id))
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '80vw', sm: 380 }, maxWidth: 380 } }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontFamily: 'Futura, sans-serif' }}>
          My Cart ({cart.length})
        </Typography>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {cart.map(item => (
            <Box key={item.id} sx={{ display: 'flex', mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
              <Box sx={{ width: 80, height: 80, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'hidden', mr: 1 }}>
                <Image src={item.img} alt={item.title} width={80} height={80} style={{ objectFit: 'contain' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Futura, sans-serif' }}>{item.subtitle}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <IconButton size="small" onClick={() => handleDecrease(item.id)}><RemoveIcon fontSize="inherit" /></IconButton>
                  <Typography sx={{ mx: 0.5, fontFamily: 'Futura, sans-serif' }}>{item.qty}</Typography>
                  <IconButton size="small" onClick={() => handleIncrease(item.id)}><AddIcon fontSize="inherit" /></IconButton>
                  <IconButton onClick={() => handleDelete(item.id)} sx={{ ml: 'auto' }}><DeleteOutlineIcon /></IconButton>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontFamily: 'Futura, sans-serif' }}>Total</Typography>
            <Typography variant="subtitle1" sx={{ fontFamily: 'Futura, sans-serif', fontWeight: 600 }}>{formatINR(subtotal)}</Typography>
          </Box>
          <Button variant="contained" fullWidth disabled={cart.length === 0}
            sx={{ bgcolor: '#fe5000', '&:hover': { bgcolor: '#d64500' }, fontFamily: 'Futura, sans-serif' }}
            onClick={() => { router.push('/cart'); onClose(); }}>
            Proceed to Checkout
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}
