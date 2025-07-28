'use client';

import { Box, Typography, Link, Stack, IconButton, Container, TextField, InputAdornment } from '@mui/material';
import Grid from '@mui/material/Grid';
import InstagramIcon from '@mui/icons-material/Instagram';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #333',
        color: '#fff',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ px: { xs: 2, sm: 3, md: 3, lg: 3 }, py: { xs: 3, sm: 4, md: 4, lg: 4 } }}>
          <Grid container spacing={4}>
            {/* Column 1: About Us (Learn More only) - Shifted 3vw to the right on desktop */}
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Stack spacing={0.5} sx={{ marginLeft: { md: '6vw', lg: '6vw' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, letterSpacing: 1, fontFamily: '"Montserrat", sans-serif ' }}>ABOUT US</Typography>
                <Stack spacing={0.5}>
                  <Link href="/about" underline="hover" sx={{ color: 'inherit', fontSize: 14, fontFamily: '"Montserrat", sans-serif ' }}>Learn More</Link>
                </Stack>
              </Stack>
            </Grid>

            {/* Column 2: Policies + Disclaimer + Contact Us */}
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, letterSpacing: 1, fontFamily: '"Montserrat", sans-serif ' }}>POLICIES</Typography>
                <Stack spacing={0.5}>
                  <Link href="/returnPolicy" underline="hover" sx={{ color: 'inherit', fontSize: 14, fontFamily: '"Montserrat", sans-serif ' }}>Return Your Order</Link>
                  <Link href="/shipping" underline="hover" sx={{ color: 'inherit', fontSize: 14, fontFamily: '"Montserrat", sans-serif ' }}>Shipping Policy</Link>
                  <Link href="/cancelRefund" underline="hover" sx={{ color: 'inherit', fontSize: 14, fontFamily: '"Montserrat", sans-serif ' }}>Cancel and refund</Link>
                  <Link href="/privacy" underline="hover" sx={{ color: 'inherit', fontSize: 14, fontFamily: '"Montserrat", sans-serif ' }}>Privacy Policy</Link>
                  <Link href="/disclaimer" underline="hover" sx={{ color: 'inherit', fontSize: 14, fontFamily: '"Montserrat", sans-serif ' }}>Disclaimer</Link>
                  <Link href="/contact" underline="hover" sx={{ color: 'inherit', fontSize: 14, fontFamily: '"Montserrat", sans-serif ' }}>Contact Us</Link>
                </Stack>
              </Box>
            </Grid>

            {/* Column 3: Newsletter only */}
            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, letterSpacing: 1 }}>NEWSLETTER</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  You can be the first one to know about our new releases, latest offers and more. <Link href="#" underline="hover" sx={{ color: 'primary.main', fontWeight: 500 }}>Sign up now!</Link>
                </Typography>
                <Box component="form" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TextField
                    placeholder="Your E-mail"
                    size="small"
                    variant="outlined"
                    sx={{
                      background: '#fff',
                      borderRadius: 1,
                      flex: 1,
                      '& .MuiOutlinedInput-root': { pr: 0 }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="submit" sx={{ color: 'primary.main', borderRadius: 1 }}>
                            <ArrowForwardIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Column 4: Follow Us - Shifted 3vw to the right on desktop */}
            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
              <Box sx={{ marginLeft: { md: '3vw', lg: '6vw' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, letterSpacing: 1 }}>FOLLOW US</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>Stay in touch!</Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" component="a" href="https://www.facebook.com/profile.php?id=61576563387778" target="_blank" rel="noopener noreferrer" aria-label="Facebook" sx={{ color: '#fff', border: '1px solid #333', borderRadius: 1 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" fill="#fff"/></svg>
                  </IconButton>
                  {/* <IconButton size="small" component="a" href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter" sx={{ color: '#fff', border: '1px solid #333', borderRadius: 1 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.916 4.916 0 0 0 16.616 3c-2.717 0-4.92 2.206-4.92 4.924 0 .386.045.762.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.212c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z" fill="#fff"/></svg>
                  </IconButton> */}
                  <IconButton size="small" component="a" href="https://www.instagram.com/minicon.in_?igsh=eG52aTJjcWhsdHJ5" target="_blank" rel="noopener noreferrer" aria-label="Instagram" sx={{ color: '#fff', border: '1px solid #333', borderRadius: 1 }}>
                    <InstagramIcon fontSize="small" />
                  </IconButton>
                  {/* <IconButton size="small" component="a" href="#" target="_blank" rel="noopener noreferrer" aria-label="YouTube" sx={{ color: '#fff', border: '1px solid #333', borderRadius: 1 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff"/></svg>
                  </IconButton> */}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}