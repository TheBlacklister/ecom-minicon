import { Box, Stack, Typography, Button } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

const About = () => {
  return (
    <Box sx={{ width: '100vw', minHeight: '80vh', bgcolor: '#fff', py: { xs: 2, md: 6 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ height: '100%', width: '100%' }}>
        <Box flex={1} minHeight={{ xs: 220, md: '80vh' }} position="relative" sx={{ width: '100%' }}>
          <Image src="/images/mockup4.png" alt="About Us Product" fill style={{ objectFit: 'cover' }} sizes="(max-width: 900px) 100vw, 50vw" />
        </Box>
        <Box flex={1} display="flex" alignItems="center" justifyContent="center" sx={{ bgcolor: '#fff', width: '100%' }}>
          <Box maxWidth={600} px={{ xs: 2, md: 4 }} py={{ xs: 3, md: 0 }}>
            <Typography variant="h3" fontWeight={400} mb={3} fontSize={{ xs: '2rem', md: '3rem' }} fontFamily="Futura, sans-serif">ABOUT US</Typography>
            <Typography fontSize={{ xs: '1rem', md: '1.3rem' }} lineHeight={1.7} mb={4} color="#222" fontFamily="Futura, sans-serif">
              <strong>Minicon – Where Minimalism Meets Streetwear Aesthetic</strong>
            </Typography>
            <Typography fontSize={{ xs: '1rem', md: '1.3rem' }} lineHeight={1.7} mb={4} color="#222" fontFamily="Futura, sans-serif">
              Minicon is more than a clothing brand—it&apos;s a curated lifestyle. A community that values authentic expression, sustainable fashion, and understated elegance. In every thread, we embed the spirit of modern rebellion with minimalist flair. So, whether you&apos;re searching for versatile streetwear for everyday wear, or building your capsule wardrobe, Minicon invites you to explore a space where simplicity becomes statement.
            </Typography>
            <Link href="/" passHref legacyBehavior>
              <Button variant="contained" sx={{ background: '#111', color: '#fff', fontSize: { xs: '1rem', md: '1.1rem' }, borderRadius: 2, fontWeight: 500, letterSpacing: 1, px: 4, py: 2, mb: 3, textTransform: 'none', fontFamily: 'Futura, sans-serif', '&:hover': { background: '#222' } }}>
                Shop Now
              </Button>
            </Link>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default About;