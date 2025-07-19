'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';

export default function ProfileSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string } | null>(null)

  const [loading, setLoading] = useState(true)

  // State for modal open/close
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {}
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`
      fetch('/api/profile', { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setProfile({ name: data.name ?? '', email: data.email ?? '', phone: data.phone ?? '' })
            setForm({ name: data.name ?? '', email: data.email ?? '', phone: data.phone ?? '' })
          } else {
            setOpen(true)
          }
          setLoading(false)
        })
    })
  }, [])

  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  const handleOpen = () => {
    setForm(profile ?? { name: '', email: '', phone: '' })
    setOpen(true)
  }

  const handleClose = () => setOpen(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit form: update main profile state
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = profile ? 'PUT' : 'POST'
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch('/api/profile', {
      method,
      headers,
      body: JSON.stringify(form)
    })
    if (res.ok) {
      const data = await res.json()
      setProfile({ name: data.name, email: data.email, phone: data.phone })
    }
    setOpen(false)
  }

  if (loading) return null

  return (
    <>
      <Card variant="outlined" sx={{ 
        maxWidth: 600, 
        backgroundColor: '#fff',
        fontFamily: '"Montserrat", sans-serif ',
        width: '100%'
      }}>
        <CardContent>
          <Typography 
            color="black" 
            variant={isMobile ? "subtitle1" : "h6"} 
            fontWeight={600} 
            gutterBottom
            sx={{ fontFamily: '"Montserrat", sans-serif ' }}
          >
            Personal Information
          </Typography>
          <Stack spacing={1}>
            <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Name: {profile?.name || ''}</Typography>
            <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Email: {profile?.email || ''}</Typography>
            <Typography color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>Phone: {profile?.phone || ''}</Typography>
          </Stack>
          <Button 
            variant="contained" 
            sx={{ 
              mt: 2,
              fontFamily: '"Montserrat", sans-serif ',
              width: { xs: '100%', sm: 'auto' }
            }} 
            onClick={handleOpen}
          >
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <form style={{ backgroundColor: '#fff', fontFamily: '"Montserrat", sans-serif ' }} onSubmit={handleSubmit}>
          <DialogContent sx={{ minWidth: { xs: '100%', sm: 340 } }}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                name="name"
                fullWidth
                value={form.name}
                onChange={handleChange}
                autoFocus
                required
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif ' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif ' }
                }}
              />
              <TextField
                label="Email"
                name="email"
                fullWidth
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif ' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif ' }
                }}
              />
              <TextField
                label="Phone"
                name="phone"
                fullWidth
                value={form.phone}
                onChange={handleChange}
                required
                sx={{ 
                  '& .MuiInputBase-root': { fontFamily: '"Montserrat", sans-serif ' },
                  '& .MuiInputLabel-root': { fontFamily: '"Montserrat", sans-serif ' }
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleClose} 
              color="inherit"
              sx={{ fontFamily: '"Montserrat", sans-serif ' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ fontFamily: '"Montserrat", sans-serif ' }}
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
