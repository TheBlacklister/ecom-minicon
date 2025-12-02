'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Box, TextField, Typography, Button, Snackbar, Alert, IconButton, InputAdornment } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)

  const [sessionValid, setSessionValid] = useState(false)

  const [alert, setAlert] = useState({ open: false, type: 'info', msg: '' })
  const showAlert = (type: any, msg: string) => setAlert({ open: true, type, msg })

  useEffect(() => {
    // Verify session from the reset link
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) showAlert('error', 'Invalid or expired reset link')
      else setSessionValid(true)
    })
  }, [])

  const handleUpdate = async () => {
    if (!sessionValid) return

    if (newPassword !== confirmPassword)
      return showAlert('error', 'Passwords do not match')

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      showAlert('error', error.message)
    } else {
        showAlert('success', 'Password updated! Please login again.');
        await supabase.auth.signOut();
        setTimeout(() => router.push('/login'), 1500);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 8 }}>
      <Typography variant='h5' sx={{ mb: 2 }}>Reset Password</Typography>

      <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label='New Password'
          type={show1 ? 'text' : 'password'}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton onClick={() => setShow1(!show1)}>
                  {show1 ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <TextField
          label='Confirm Password'
          type={show2 ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton onClick={() => setShow2(!show2)}>
                  {show2 ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Button sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }} variant='contained' onClick={handleUpdate}>
          UPDATE PASSWORD
        </Button>
      </Box>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.type as any}>{alert.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
