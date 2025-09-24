'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { GridLegacy as Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { getFormattedOptimizedImageSrc } from '@/lib/imageOptimizer';

interface CategoryCardProps {
  image: string;
  title: string;
  route: string;
}

const categories: CategoryCardProps[] = [
  { 
    image: '/products/Regular Fit Tshirt/Rabbit/3 rabbit.png', 
    title: 'Under 999',
    route: '/categories/price_after/999'
  },
  { 
    image: '/products/Regular Fit Tshirt/Flourish-N_Asthestic/1Flourish.png', 
    title: 'T-shirts',
    route: '/categories/shop-by/new-arrivals'
  },
  { 
    image: '/products/Oversized Solid/Oversized Solid/Yellow Mustard/2Solid yellow Mustard Oversized Classic T-Shirt.png', 
    title: 'Oversized',
    route: '/categories/category/oversized-fit'
  },
  { 
    image: '/products/Regular Fit Tshirt/Hedgehog_Printed & Streetwear/1Hedgehog Regular fit.png', 
    title: 'Regular',
    route: '/categories/category/regular-fit'
  },
  { 
    image: "/products/Men's Polo T-Shirt/Men's Polo T-Shirt/Black/1Men Black embroidery Polo T-Shirt.png", 
    title: 'Polo',
    route: "/categories/category/men's-polo"
  },
  { 
    image: "/products/Mens Gym vest/Mens Gym vest/Maroon-Printed/3hustle for the muscle.png", 
    title: 'Gym vest',
    route: "/categories/category/men's-gym"
  },
  { 
    image: '/products/Sweatshirt/Yellow Mustard- aesthetic or minimalist/2Bloom Yellow Mustard Sweatshirt.png', 
    title: 'Sweatshirts',
    route: "/categories/category/men's-sweatshirts"
  },
  { 
    image: '/products/Oversized Tshirt (2)/Oversized Tshirt/Minicon Puff Gray_Minimalist or Puff/1Minicon Puff Gray.png', 
    title: 'Puff',
    route: '/categories/collections/puffed'
  },
  { 
    image: '/products/Regular fit Solid Supima/Regular fit Solid Supima/supimaThumbNail.jpg', 
    title: 'Supima',
    route: '/categories/material/super_combed_cotton'
  },
];

export default function CategoryCards() {
  const router = useRouter();

  const handleCategoryClick = (route: string) => {
    router.push(route);
  };

  return (
    <Box sx={{ mb: 4, px: { xs: 1, sm: 2 } }}>
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {categories.map((category, idx) => (
          <Grid
            item
            xs={4}
            sm={4}
            key={idx}
          >
            <Box
              onClick={() => handleCategoryClick(category.route)}
              sx={{
                position: 'relative',
                aspectRatio: '9/16',
                width: '100%',
                overflow: 'hidden',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              <Image
                src={getFormattedOptimizedImageSrc(category.image)}
                alt={category.title}
                fill
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  console.error('Category image failed to load:', category.image);
                  e.currentTarget.src = '/placeholder.jpg';
                }}
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
                    fontFamily: '"Montserrat", sans-serif ',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
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