"use client";
import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readOnly = false,
  size = 'medium',
  showText = false
}) => {
  const sizeMap = {
    small: 20,
    medium: 24,
    large: 32
  };

  const iconSize = sizeMap[size];

  const handleStarClick = (starRating: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IconButton
            key={star}
            onClick={() => handleStarClick(star)}
            sx={{
              padding: '4px',
              color: star <= rating ? '#FF8C00' : '#E0E0E0',
              cursor: readOnly ? 'default' : 'pointer',
              '&:hover': readOnly ? {} : {
                color: '#FF8C00',
                backgroundColor: 'rgba(255, 140, 0, 0.1)'
              }
            }}
            disabled={readOnly}
          >
            {star <= rating ? (
              <StarIcon sx={{ fontSize: iconSize, color: '#FFD700' }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: iconSize }} />
            )}
          </IconButton>
        ))}
      </Box>
      {showText && (
        <Typography 
          variant="body2" 
          sx={{ 
            fontFamily: '"Montserrat", sans-serif',
            ml: 1,
            color: '#666'
          }}
        >
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </Typography>
      )}
    </Box>
  );
};