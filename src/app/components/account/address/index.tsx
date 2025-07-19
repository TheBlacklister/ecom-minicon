'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';

interface Address {
  id: string;
  name: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

const INITIAL_ADDRESSES: Address[] = [];

const emptyAddress: Address = {
  id: '',
  name: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
};

export default function AddressesSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {}
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`
      fetch('/api/addresses', { headers })
        .then(res => res.ok ? res.json() : [])
        .then(data => setAddresses(data))
    })
  }, [])

  // Modal control and form state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Address>(emptyAddress);
  const [editId, setEditId] = useState<string | null>(null);

  // Open modal for add or edit
  const handleOpen = (address?: Address) => {
    if (address) {
      setForm(address);
      setEditId(address.id);
    } else {
      setForm(emptyAddress);
      setEditId(null);
    }
    setOpen(true);
  };

  // Close modal
  const handleClose = () => {
    setOpen(false);
    setEditId(null);
  };

  // Form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or update address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`
    if (editId) {
      const res = await fetch('/api/addresses', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...form, id: editId })
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(addresses.map(addr => addr.id === editId ? data : addr))
      }
    } else {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers,
        body: JSON.stringify(form)
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses([data, ...addresses])
      }
    }
    setOpen(false)
  }

  // Delete address
  const handleDelete = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch('/api/addresses', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ id })
    })
    if (res.ok) {
      setAddresses(addresses.filter(addr => addr.id !== id))
    }
  }

  return (
    <>
      <Stack spacing={2}>
        {addresses.map((a) => (
          <Card key={a.id} variant="outlined" sx={{ 
            backgroundColor: '#fff',
            fontFamily: '"Montserrat", sans-serif',
            width: '100%'
          }}>
            <CardContent>
              <Typography 
                fontWeight={600} 
                color="black" 
                gutterBottom
                variant={isMobile ? "subtitle1" : "h6"}
                sx={{ fontFamily: '"Montserrat", sans-serif' }}
              >
                {a.name}
              </Typography>
              <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif' }}>{a.line1}</Typography>
              <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif' }}>
                {a.city}, {a.state} – {a.pincode}
              </Typography>
              <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif' }}>Phone: {a.phone}</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => handleOpen(a)}
                  sx={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() => handleDelete(a.id)}
                  sx={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  Delete
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
        <Button 
          variant="contained" 
          sx={{ 
            alignSelf: 'start',
            fontFamily: '"Montserrat", sans-serif',
            width: { xs: '100%', sm: 'auto' }
          }} 
          onClick={() => handleOpen()}
        >
          + Add New Address
        </Button>
      </Stack>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ 
          backgroundColor: '#fff', 
          fontFamily: '"Montserrat", sans-serif',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          {editId ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <form style={{ backgroundColor: '#fff', fontFamily: '"Montserrat", sans-serif' }} onSubmit={handleSubmit}>
          <DialogContent sx={{ minWidth: { xs: '100%', sm: 340 } }}>
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
                autoFocus
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif' }
                }}
              />
              <TextField
                label="Address Line"
                name="line1"
                value={form.line1}
                onChange={handleChange}
                required
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif' }
                }}
              />
              <TextField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif' }
                }}
              />
              <TextField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif' }
                }}
              />
              <TextField
                label="Pincode"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                required
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif' }
                }}
              />
              <TextField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif' }
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleClose} 
              color="inherit"
              sx={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              {editId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
