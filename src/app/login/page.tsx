'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TextField, Button, Box, Typography, IconButton, InputAdornment,
  Snackbar, Alert
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Snackbar (your new message system)
  const [alert, setAlert] = useState({ open: false, type: 'info', msg: '' })
  const showAlert = (type: any, msg: string) => setAlert({ open: true, type, msg })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()


    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      showAlert('error', 'Invalid login credentials')
    } else {
      showAlert('success', 'Login successful!')
      setTimeout(() => router.push('/'), 1200)
    }
  }

  const handleForgotPassword = async () => {

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== 'undefined'
          ? `${window.location.origin}/update-password`
          : 'https://www.minicon.in/update-password'
    })

    if (error) {
      showAlert('error', error.message)
    } else {
      showAlert('success', 'Password reset link sent to your email.')
    }
  }

  return (
    <Box sx={{
      bgcolor: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pt: 8
    }}>
      <Typography variant='h5' sx={{ mb: 2 }}>Login</Typography>

      <form 
        onSubmit={handleSubmit}
        style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <TextField 
          label='Email' 
          type='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          required 
        />

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

        <Button 
          type='submit'
          variant='contained'
          sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
        >
          LOGIN
        </Button>
      </form>

      <Button sx={{ mt: 2 }} onClick={() => router.push('/signup')}>
        CREATE ACCOUNT
      </Button>

      <Button sx={{ mt: 1 }} onClick={handleForgotPassword} disabled={!email}>
        FORGOT PASSWORD?
      </Button>

      <Snackbar 
        open={alert.open} 
        autoHideDuration={3000} 
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.type as any}>{alert.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
