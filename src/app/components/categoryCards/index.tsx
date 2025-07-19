'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { GridLegacy as Grid } from '@mui/material';

interface CategoryCardProps {
  image: string;
  title: string;
}

const categories: CategoryCardProps[] = [
  { image: '/products/Regular Fit Tshirt/Rabbit/3 rabbit.png', title: 'T-shirts' },
  { image: '/products/Regular Fit Tshirt/Peace/3Peace.png', title: 'Under 999' },
  { image: '/products/Regular Fit Tshirt/Supernova/1Supernova.png', title: 'Oversized' },
  { image: '/products/Regular Fit Tshirt/Aesthetics Bloom/2Minicon Asthetic 2.png', title: 'Relaxed' },
  { image: '/products/Regular Fit Tshirt/Aesthetic Outgrown/1Minicon Asthetic 3.png', title: 'Polo' },
  { image: '/products/Regular Fit Tshirt/Aesthetics Royal Blue/5 Minicon Asthetic.png', title: 'Gym vest' },
  { image: '/products/Regular Fit Tshirt/AstroBuddy/2 AstroBuddy.png', title: 'Sweatshirts' },
  { image: '/products/Regular Fit Tshirt/Hedgehog/2Hedgehog Regular fit.png', title: 'Puff' },
  { image: '/products/Regular Fit Tshirt/Hoot Pepar/3Hoot Pepar.png', title: 'Supima' },
];



export default function CategoryCards() {
  return (
    <Box sx={{ mb: 4, px: { xs: 1, sm: 2 } }}> {/* Added horizontal padding */}
      <Grid container spacing={{ xs: 1, sm: 2 }}> {/* Added spacing */}
        {categories.map((category, idx) => (
          <Grid
            item
            xs={4} // Changed from 6 to 4 for 3 columns on mobile
            sm={4}
            key={idx}
          >
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '9/16',
                width: '100%',
                overflow: 'hidden',
                borderRadius: 2,
              }}
            >
              <Image
                src={category.image}
                alt={category.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              {/* Dark to transparent vignette overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 10%, transparent 20%)',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  px: 1,
                  py: 0.5,
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="#fff"
                  fontWeight={500}
                  sx={{ 
                    fontFamily: 'Futura, sans-serif',
                    fontSize: { xs: '0.875rem', sm: '1rem' } // Smaller font on mobile
                  }}
                >
                  {category.title}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}