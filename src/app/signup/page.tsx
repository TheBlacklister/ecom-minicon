'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, Button, Box, Typography, IconButton, InputAdornment, Snackbar, Alert } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [alert, setAlert] = useState({ open: false, type: 'info', msg: '' })
  const showAlert = (type: any, msg: string) => setAlert({ open: true, type, msg })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      if (res.status === 409) {
        showAlert('info', 'User already exists! Redirecting to login...');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }
  
      showAlert('error', data.error || 'Signup failed');
      return;
    }
  
    showAlert('success', 'Account created! Redirecting...');
    setTimeout(() => router.push('/login'), 1500);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 8 }}>
      <Typography variant='h5' sx={{ mb: 2 }}>Sign Up</Typography>

      <form onSubmit={handleSubmit} style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextField label='Name' value={name} onChange={e => setName(e.target.value)} required />

        <TextField label='Email' type='email' value={email} onChange={e => setEmail(e.target.value)} required />

        <TextField
          label='Password'
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Button type='submit' variant='contained' sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}>
          CREATE ACCOUNT
        </Button>
      </form>

      <Button sx={{ mt: 2 }} onClick={() => router.push('/login')}>BACK TO LOGIN</Button>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.type as any}>{alert.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
