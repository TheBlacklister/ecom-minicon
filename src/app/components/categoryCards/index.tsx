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
    image: '/products/regular-fit-tshirt/rabbit_asthestic/3-rabbit.webp', 
    title: 'Under 999',
    route: '/categories/price_after/999'
  },
  { 
    image: '/products/regular-fit-tshirt/flourish-n_asthestic/1flourish.webp', 
    title: 'T-shirts',
    route: '/categories/shop-by/new-arrivals'
  },
  { 
    image: '/products/oversized-solid/oversized-solid/yellow-mustard/2solid-yellow-mustard-oversized-classic-t-shirt.webp', 
    title: 'Oversized',
    route: '/categories/category/oversized-fit'
  },
  { 
    image: '/products/regular-fit-tshirt/hedgehog_printed-and-streetwear/1hedgehog-regular-fit.webp', 
    title: 'Regular',
    route: '/categories/category/regular-fit'
  },
  { 
    image: "/products/mens-polo-t-shirt/mens-polo-t-shirt/black/1men-black-embroidery-polo-t-Shirt.webp", 
    title: 'Polo',
    route: "/categories/category/men's-polo"
  },
  { 
    image: "/products/mens-gym-vest/mens-gym-vest/maroon-printed/3hustle-for-the-muscle.webp", 
    title: 'Gym vest',
    route: "/categories/category/men's-gym"
  },
  { 
    image: '/products/sweatshirt/yellow-mustard-aesthetic-or-minimalist/2bloom-yellow-mustard-sweatshirt.webp', 
    title: 'Sweatshirts',
    route: "/categories/category/men's-sweatshirts"
  },
  { 
    image: '/products/oversized-tshirt-2/oversized-tshirt/minicon-puff-gray_minimalist-or-puff/1minicon-puff-gray.webp', 
    title: 'Puff',
    route: '/categories/collections/puffed'
  },
  { 
    image: '/products/regular-fit-solid-supima/regular-fit-solid-supima/supimathumbnail.jpg', 
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