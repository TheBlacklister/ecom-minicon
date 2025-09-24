"use client";
import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from '@/types';
import Image from "next/image";
import { Typography, Button, Box, Accordion, AccordionSummary, AccordionDetails, IconButton, Dialog, DialogContent, CircularProgress, Skeleton, Snackbar, Alert, Container, TextField, Paper, Chip} from "@mui/material";
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { useCount } from '../components/CountProvider';
import { ProductCard } from '../components/productCard';
import { GridLegacy as Grid } from '@mui/material';
import { StarRating } from '../components/StarRating';
import { getFormattedOptimizedImageSrc } from '@/lib/imageOptimizer';

const PreCheckout = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { incrementCartCount, incrementWishlistCount, decrementWishlistCount } = useCount();
  const id = searchParams.get("id");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWished, setIsWished] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [mainImageLoading, setMainImageLoading] = useState(true);
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState<boolean[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [userExistingReview, setUserExistingReview] = useState<any>(null);
  const [userReviewRating, setUserReviewRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [userRating, setUserRating] = useState(0);

  // Coupon data
  const availableCoupons = [
    {
      code: 'FLAT500',
      discount: 500,
      description: 'Get flat ₹500 off on orders above ₹2000',
      minOrder: 2000,
      type: 'flat_discount'
    }
  ];
 
  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const data: Product[] = await res.json();
        const prod = data.find(p => p.id === Number(id)) || null;
        setProduct(prod);
        if (prod) {
          setSelectedSize(prod.available_sizes[0] || '');
          // Initialize thumbnails loaded state
          setThumbnailsLoaded(new Array(prod.images?.length || 0).fill(false));
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  // Check initial wishlist status
  useEffect(() => {
    if (!product || !user) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      fetch(`/api/wishlist?productId=${product.id}`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => setIsWished(data?.isWished || false));
    });
  }, [user, product]);

  // Fetch suggested products based on matching collections
  useEffect(() => {
    if (!product) return;
    
    setSuggestedLoading(true);
    fetch('/api/products')
      .then(res => res.ok ? res.json() : [])
      .then((allProducts: Product[]) => {
        // Filter products with matching collections, excluding current product
        const matchingProducts = allProducts.filter(p => 
          p.id !== product.id && // Exclude current product
          p.is_active !== false && // Only active products
          p.collections && p.collections.length > 0 && // Has collections
          product.collections && product.collections.length > 0 && // Current product has collections
          p.collections.some(collection => 
            product.collections.includes(collection)
          )
        ).slice(0, 8); // Limit to 8 products
        
        setSuggestedProducts(matchingProducts);
      })
      .catch(error => {
        console.error('Error fetching suggested products:', error);
        setSuggestedProducts([]);
      })
      .finally(() => {
        setSuggestedLoading(false);
      });
  }, [product]);

  // Fetch review data
  useEffect(() => {
    if (!product) return;
    
    fetch(`/api/reviews?productId=${product.id}`)
      .then(res => res.ok ? res.json() : { reviews: [] })
      .then(data => {
        const reviews = data.reviews || [];
        setReviewCount(reviews.length);
        if (reviews.length > 0) {
          const avgRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
          setAverageRating(Math.round(avgRating * 10) / 10); // Round to 1 decimal
        } else {
          setAverageRating(0);
        }
        
        // Check if current user has already rated this product
        if (user) {
          const existingUserReview = reviews.find((review: any) => review.user_id === user.id);
          if (existingUserReview) {
            setUserRating(existingUserReview.rating);
          } else {
            setUserRating(0);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching reviews:', error);
        setAverageRating(0);
        setReviewCount(0);
        setUserRating(0);
      });
  }, [product, user]);

  // Fetch detailed reviews for the review section
  const fetchDetailedReviews = useCallback(async () => {
    if (!product) return;
    
    try {
      setReviewsLoading(true);
      const response = await fetch(`/api/reviews?productId=${product.id}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews || []);
        
        // Check if current user has already reviewed this product
        if (user) {
          const existingReview = data.reviews?.find((review: any) => review.user_id === user.id);
          setUserExistingReview(existingReview || null);
          if (existingReview) {
            setUserReviewRating(existingReview.rating);
            setReviewComment(existingReview.comment || '');
          }
        }
      } else {
        setReviewError(data.error || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviewError('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  }, [product, user]);

  // Load reviews when product is available
  useEffect(() => {
    if (product) {
      fetchDetailedReviews();
    }
  }, [product, user, fetchDetailedReviews]);

  // Show loading screen while fetching data
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          bgcolor: 'white',
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: '#e53935',
            mb: 3 
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: '"Montserrat", sans-serif',
            color: '#666',
            fontWeight: 500 
          }}
        >
          Loading product details...
        </Typography>
      </Box>
    );
  }

  // Show error message if product not found after loading
  if (!product) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          bgcolor: 'white',
        }}
      >
        <Typography 
          variant="h5" 
          color="error"
          sx={{ 
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 600,
            mb: 2
          }}
        >
          Product not found
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
          sx={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Go back to home
        </Button>
      </Box>
    );
  }

  // Get formatted and optimized images array
  const formattedImages = product.images?.map(getFormattedOptimizedImageSrc) || [];

  // Handlers
  const handleWishlistToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    if (isWished) {
      const response = await fetch('/api/wishlist', { method: 'DELETE', headers, body: JSON.stringify({ productId: product.id }) });
      if (response.ok) {
        setIsWished(false);
        decrementWishlistCount();
      }
    } else {
      const response = await fetch('/api/wishlist', { method: 'POST', headers, body: JSON.stringify({ productId: product.id }) });
      if (response.ok) {
        setIsWished(true);
        incrementWishlistCount();
      }
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: product.id, quantity: quantity, selected_size: selectedSize })
    });
    if (res.ok) {
      await res.json();
      // Update cart count optimistically
      incrementCartCount();
      // Show success notification
      setShowNotification(true);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    
    const response = await fetch('/api/cart?buyNow=true', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product_id: product.id,
        quantity: quantity,
        selected_size: selectedSize,
        coupon: selectedCoupon?.code || null
      })
    });
    
    if (response.ok) {
      // Update cart count optimistically
      incrementCartCount();
      const couponParam = selectedCoupon?.code ? `&coupon=${selectedCoupon.code}` : '';
      router.push(`/cart?buyNow=${product.id}${couponParam}`);
    }
  };

  const handlePrevImage = () => {
    setMainImageLoading(true);
    setCurrentImageIndex((prev) => 
      prev === 0 ? formattedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setMainImageLoading(true);
    setCurrentImageIndex((prev) => 
      prev === formattedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleThumbnailClick = (index: number) => {
    if (index !== currentImageIndex) {
      setMainImageLoading(true);
      setCurrentImageIndex(index);
    }
  };

  const handleSizeChartOpen = () => {
    setSizeChartOpen(true);
  };

  const handleSizeChartClose = () => {
    setSizeChartOpen(false);
  };

  const handleThumbnailLoad = (index: number) => {
    setThumbnailsLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  // Social sharing handlers
  const handleWhatsAppShare = () => {
    const currentUrl = window.location.href;
    const message = `Check out this product: ${product?.title || 'Amazing Product'}\n\n${currentUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const currentUrl = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleInstagramShare = () => {
    // Instagram doesn't have direct URL sharing like WhatsApp/Facebook
    // This will copy the URL to clipboard for the user to paste
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      alert('URL copied to clipboard! You can now paste it in your Instagram story or post.');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('URL copied to clipboard! You can now paste it in your Instagram story or post.');
    });
  };

  // Coupon selection handler
  const handleCouponSelect = (coupon: typeof availableCoupons[0]) => {
    if (selectedCoupon?.code === coupon.code) {
      setSelectedCoupon(null); // Deselect if already selected
    } else {
      setSelectedCoupon(coupon);
    }
  };

  // Calculate discounted price
  const getDiscountedPrice = () => {
    if (!selectedCoupon) return product?.price_after || 0;
    
    const basePrice = (product?.price_after || 0) * quantity;
    
    // Check if minimum order requirement is met
    if (selectedCoupon.minOrder && basePrice < selectedCoupon.minOrder) {
      return basePrice;
    }
    
    return Math.max(0, basePrice - selectedCoupon.discount);
  };

  // Check if coupon is applicable
  const isCouponApplicable = (coupon: typeof availableCoupons[0]) => {
    if (!coupon.minOrder) return true;
    const basePrice = (product?.price_after || 0) * quantity;
    return basePrice >= coupon.minOrder;
  };

  // Handle user rating change
  const handleUserRatingChange = async (newRating: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!product) return;

    const previousRating = userRating;
    setUserRating(newRating);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      };

      // Check if user already has a review by fetching current reviews
      const reviewsResponse = await fetch(`/api/reviews?productId=${product.id}`);
      const reviewsData = await reviewsResponse.json();
      const existingUserReview = reviewsData.reviews?.find((review: any) => review.user_id === user.id);

      let response;
      if (existingUserReview) {
        // Update existing review
        response = await fetch('/api/reviews', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ 
            reviewId: existingUserReview.id,
            rating: newRating, 
            comment: existingUserReview.comment || '' 
          })
        });
      } else {
        // Create new review
        response = await fetch('/api/reviews', {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            productId: product.id, 
            rating: newRating, 
            comment: '' 
          })
        });
      }

      if (response.ok) {
        // Refresh review data to update average rating
        fetch(`/api/reviews?productId=${product.id}`)
          .then(res => res.ok ? res.json() : { reviews: [] })
          .then(data => {
            const reviews = data.reviews || [];
            setReviewCount(reviews.length);
            if (reviews.length > 0) {
              const avgRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
              setAverageRating(Math.round(avgRating * 10) / 10);
            } else {
              setAverageRating(0);
            }
          });
      } else {
        // Revert rating on error
        setUserRating(previousRating);
        console.error('Error saving rating:', await response.text());
      }
    } catch (error) {
      console.error('Error saving rating:', error);
      // Revert rating on error
      setUserRating(previousRating);
    }
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!user) {
      setReviewError('Please login to submit a review');
      return;
    }

    if (userReviewRating === 0) {
      setReviewError('Please select a rating');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError('');

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      };

      const method = userExistingReview ? 'PUT' : 'POST';
      const body = userExistingReview 
        ? { reviewId: userExistingReview.id, rating: userReviewRating, comment: reviewComment }
        : { productId: product?.id, rating: userReviewRating, comment: reviewComment };

      const response = await fetch('/api/reviews', {
        method,
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setReviewSuccess(userExistingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        setUserReviewRating(0);
        setReviewComment('');
        fetchDetailedReviews(); // Refresh reviews
        
        // Also refresh the rating data in the header
        fetch(`/api/reviews?productId=${product?.id}`)
          .then(res => res.ok ? res.json() : { reviews: [] })
          .then(data => {
            const reviews = data.reviews || [];
            setReviewCount(reviews.length);
            if (reviews.length > 0) {
              const avgRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
              setAverageRating(Math.round(avgRating * 10) / 10);
            } else {
              setAverageRating(0);
            }
            
            // Update user's rating if they have one
            if (user) {
              const existingUserReview = reviews.find((review: any) => review.user_id === user.id);
              if (existingUserReview) {
                setUserRating(existingUserReview.rating);
              } else {
                setUserRating(0);
              }
            }
          });
      } else {
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userExistingReview || !user) return;

    try {
      setReviewSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${session?.access_token}`
      };

      const response = await fetch(`/api/reviews?reviewId=${userExistingReview.id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setReviewSuccess('Review deleted successfully!');
        setUserReviewRating(0);
        setReviewComment('');
        setUserExistingReview(null);
        fetchDetailedReviews(); // Refresh reviews
        
        // Also refresh the rating data in the header
        fetch(`/api/reviews?productId=${product?.id}`)
          .then(res => res.ok ? res.json() : { reviews: [] })
          .then(data => {
            const reviews = data.reviews || [];
            setReviewCount(reviews.length);
            if (reviews.length > 0) {
              const avgRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
              setAverageRating(Math.round(avgRating * 10) / 10);
            } else {
              setAverageRating(0);
            }
            
            // Update user's rating if they have one
            if (user) {
              const existingUserReview = reviews.find((review: any) => review.user_id === user.id);
              if (existingUserReview) {
                setUserRating(existingUserReview.rating);
              } else {
                setUserRating(0);
              }
            }
          });
      } else {
        const data = await response.json();
        setReviewError(data.error || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setReviewError('Failed to delete review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 0, md: 6 },
        padding: { xs: "0", md: "5vh 7vw" },
        bgcolor: "white",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        boxSizing: "border-box"
      }}
    >
      {/* Product Image with carousel */}
      <Box
        sx={{
          width: { xs: '100vw', md: '38vw' },
          minWidth: {  md: 220 },
          flexShrink: 0,
          alignSelf: { md: 'flex-start' },
          mb: { xs: 2, md: 0 },
          ml: { xs: 'calc(-50vw + 50%)', sm: 'calc(-50vw + 50%)', md: 0 },
          mr: { xs: 'calc(-50vw + 50%)', sm: 'calc(-50vw + 50%)', md: 0 },
          px: { xs: 0, md: 0 },
        }}
      >
        {/* Main Image with Navigation */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            // On mobile: let height be auto to maintain aspect ratio, on desktop: fixed 4/5 ratio
            aspectRatio: { xs: 'unset', md: '4/5' },
            minHeight: { xs: '70vh', md: 'auto' },
            maxHeight: { xs: '90vh', md: 'none' },
            bgcolor: 'white',
            borderRadius: { xs: 0, md: 3 },
            overflow: 'hidden',
            mb: 2,
          }}
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          {/* Loading skeleton for main image */}
          {mainImageLoading && (
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: 2,
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={40} />
            </Box>
          )}

          {formattedImages.length > 0 ? (
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            >
              <Image
                key={currentImageIndex}
                src={formattedImages[currentImageIndex]}
                alt={`${product.title} - Image ${currentImageIndex + 1}`}
                fill
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center top'
                }}
                sizes="(max-width: 600px) 100vw, 40vw"
                quality={75}
                onLoad={() => setMainImageLoading(false)}
                onError={() => setMainImageLoading(false)}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.200',
                color: 'grey.500',
              }}
            >
              <Typography>No image available</Typography>
            </Box>
          )}

          {/* Navigation Arrows - Only show on hover and if more than 1 image */}
          {formattedImages.length > 1 && isHoveringImage && (
            <>
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                  zIndex: 3,
                  boxShadow: 1,
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                  zIndex: 3,
                  boxShadow: 1,
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          )}

          {/* Image Dots Indicator */}
          {formattedImages.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                zIndex: 2,
              }}
            >
              {formattedImages.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: index === currentImageIndex ? 'grey.800' : 'rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'grey.700',
                      transform: 'scale(1.2)',
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Thumbnail Gallery with Progressive Loading */}
        {formattedImages.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 1,
              px: { xs: 2, md: 0 },
              '&::-webkit-scrollbar': {
                height: 6,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'grey.200',
                borderRadius: 3,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'grey.400',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'grey.500',
                },
              },
            }}
          >
            {formattedImages.map((image, index) => (
              <Box
                key={index}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  position: 'relative',
                  width: 80,
                  height: 100,
                  flexShrink: 0,
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: index === currentImageIndex ? '2px solid' : '1px solid',
                  borderColor: index === currentImageIndex ? 'primary.main' : 'grey.300',
                  transition: 'all 0.3s ease',
                  bgcolor: 'grey.100',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                {/* Skeleton loader for thumbnail */}
                {!thumbnailsLoaded[index] && (
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={100}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                )}
                <Image
                  src={image}
                  alt={`${product.title} - Thumbnail ${index + 1}`}
                  fill
                  style={{ 
                    objectFit: 'cover',
                    opacity: thumbnailsLoaded[index] ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  sizes="80px"
                  quality={40} // Lower quality for thumbnails
                  onLoad={() => handleThumbnailLoad(index)}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Product Details */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          color: "black",
          pl: { md: 2 },
          px: { xs: '4vw', md: 0 },
          pt: { xs: 2, md: 0 },
        }}
      >
        {/* Title with Favorite Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Typography sx={{ fontSize: "2.1rem", fontWeight: 700, fontFamily: '"Montserrat", sans-serif ' }}>
            {product.title}
          </Typography>
          <IconButton
            aria-label="add to wishlist"
            onClick={handleWishlistToggle}
            sx={{ 
              color: isWished ? 'error.main' : 'action.disabled',
              padding: 1,
              '&:hover': {
                color: 'error.main',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <FavoriteIcon sx={{ fontSize: '1.8rem' }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: "1.2rem", mb: 1, fontFamily: '"Montserrat", sans-serif ', color: '#555' }}>
          {product.subtitle}
        </Typography>
        
        {/* Star Rating and Review Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <StarRating 
            rating={userRating || Math.round(averageRating)} 
            onRatingChange={handleUserRatingChange}
            size="medium" 
          />
          {reviewCount > 0 && (
            <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Montserrat", sans-serif' }}>
              {averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </Typography>
          )}
          <Button
            variant="text"
            onClick={() => {
              const reviewSection = document.getElementById('review-section');
              if (reviewSection) {
                reviewSection.scrollIntoView({ behavior: 'smooth' });
                // Reviews are already loaded automatically, no need to fetch again
              }
            }}
            sx={{
              fontFamily: '"Montserrat", sans-serif',
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#1976d2',
              padding: '4px 8px',
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Review
          </Button>
        </Box>
        
        {/* Price and Quantity */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: "1.6rem", fontWeight: 600, fontFamily: '"Montserrat", sans-serif ', color: '#222' }}>
              ₹{product.price_after}
            </Typography>
            {product.price_before && product.price_before > product.price_after && (
              <Typography 
                sx={{ 
                  fontSize: "1.2rem", 
                  textDecoration: 'line-through', 
                  color: 'grey.600',
                  fontFamily: '"Montserrat", sans-serif ' 
                }}
              >
                ₹{product.price_before}
              </Typography>
            )}
            <Select
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              size="small"
              sx={{ minWidth: 60, fontFamily: '"Montserrat", sans-serif ', fontWeight: 500 }}
            >
              {[...Array(10)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </Select>
          </Box>
          
          {/* Coupon Pricing Display */}
          {selectedCoupon && (
            <Box sx={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #e0e0e0', 
              borderRadius: 1, 
              p: 1.5,
              mt: 1
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif', color: '#666' }}>
                  Subtotal (Qty: {quantity})
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif', color: '#666' }}>
                  ₹{(product.price_after * quantity).toFixed(2)}
                </Typography>
              </Box>
              
              {selectedCoupon && isCouponApplicable(selectedCoupon) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif', color: '#e53935' }}>
                    Coupon ({selectedCoupon.code})
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif', color: '#e53935' }}>
                    -₹{selectedCoupon.discount}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="body1" fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif', color: '#222' }}>
                  Total
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif', color: '#222' }}>
                  ₹{getDiscountedPrice().toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Size Buttons */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, maxWidth: 'fit-content' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Montserrat", sans-serif ', mr: 3 }}>
              Select size
            </Typography>
            <Typography 
              variant="body2" 
              onClick={handleSizeChartOpen}
              sx={{ 
                color: '#1976d2', 
                fontFamily: '"Montserrat", sans-serif ', 
                cursor: 'pointer',
                textDecoration: 'underline',
                '&:hover': {
                  color: '#1565c0',
                }
              }}
            >
              Size Chart
            </Typography>
          </Box>
          <Box>
            {product.available_sizes.map((s) => (
              <Button
                key={s}
                onClick={() => setSelectedSize(s)}
                sx={{
                  border: selectedSize === s ? '2px solid #e53935' : '1px solid',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  fontSize: 14,
                  color: selectedSize === s ? '#e53935' : 'black',
                  margin: '1vh 0.5vw',
                  textTransform: 'none',
                  fontWeight: selectedSize === s ? 700 : 400,
                  fontFamily: '"Montserrat", sans-serif ',
                  bgcolor: selectedSize === s ? '#ffeaea' : 'white',
                  boxShadow: selectedSize === s ? 2 : 0,
                }}
              >
                {s}
              </Button>
            ))}
          </Box>
        </Box>
        
        {/* Coupon Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Montserrat", sans-serif', mb: 2 }}>
            Available Offers
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {availableCoupons.map((coupon) => {
              const isApplicable = isCouponApplicable(coupon);
              const isSelected = selectedCoupon?.code === coupon.code;
              
              return (
                <Box
                  key={coupon.code}
                  onClick={() => isApplicable && handleCouponSelect(coupon)}
                  sx={{
                    border: isSelected ? '2px solid #e53935' : '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    cursor: isApplicable ? 'pointer' : 'not-allowed',
                    backgroundColor: isSelected ? '#ffeaea' : isApplicable ? 'white' : '#f5f5f5',
                    opacity: isApplicable ? 1 : 0.6,
                    transition: 'all 0.3s ease',
                    '&:hover': isApplicable ? {
                      borderColor: isSelected ? '#e53935' : '#666',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    } : {},
                    position: 'relative'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          border: isSelected ? '2px solid #e53935' : '2px solid #ccc',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#e53935' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isSelected && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              backgroundColor: 'white',
                              borderRadius: '50%'
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          color: isSelected ? '#e53935' : 'black',
                          backgroundColor: '#f0f0f0',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '12px'
                        }}
                      >
                        {coupon.code}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        color: '#e53935',
                        fontSize: '14px'
                      }}
                    >
                      Save ₹{coupon.discount}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Montserrat", sans-serif',
                      color: isApplicable ? 'black' : '#666',
                      mb: 0.5,
                      fontSize: '14px'
                    }}
                  >
                    {coupon.description}
                  </Typography>
                  {coupon.minOrder && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        color: '#666',
                        fontSize: '12px'
                      }}
                    >
                      {isApplicable 
                        ? `✓ Minimum order requirement met`
                        : `Minimum order: ₹${coupon.minOrder} (Current: ₹${(product?.price_after || 0) * quantity})`
                      }
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
        
        {/* Action Buttons - Updated to vertical layout */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          mb: 2,
          maxWidth: { xs: '100%', sm: 320 },
        }}>
          <Button
            variant="contained"
            onClick={handleBuyNow}
            sx={{
              width: '100%',
              height: 54,
              fontWeight: 700,
              fontFamily: '"Montserrat", sans-serif ',
              fontSize: 17,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#000000',
              color: 'white',
              '&:hover': {
                backgroundColor: '#333333',
                boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            Buy Now
          </Button>
          <Button
            variant="outlined"
            onClick={handleAddToCart}
            sx={{
              width: '100%',
              height: 54,
              fontWeight: 700,
              fontFamily: '"Montserrat", sans-serif ',
              fontSize: 17,
              textTransform: 'none',
              borderRadius: 2,
              border: '2px solid #000000',
              color: '#000000',
              bgcolor: 'white',
              '&:hover': {
                border: '2px solid #000000',
                bgcolor: '#f5f5f5',
                color: '#000000',
              }
            }}
          >
            Add to Cart
          </Button>
        </Box>
        
        {/* Social Share Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif ', color: '#888' }}>Share</Typography>
          <Box 
            onClick={handleWhatsAppShare}
            sx={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Image
              src="/images/blackwhatsapp.png" // You can update this src later
              alt="Share on WhatsApp"
              width={24}
              height={24}
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Box 
            onClick={handleFacebookShare}
            sx={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Image
              src="/images/blackfacebook.png" // You can update this src later
              alt="Share on Facebook"
              width={24}
              height={24}
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Box 
            onClick={handleInstagramShare}
            sx={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Image
              src="/images/blackig.png" // You can update this src later
              alt="Share on Instagram"
              width={24}
              height={24}
              style={{ objectFit: 'contain' }}
            />
          </Box>
        </Box>
        
       
        
        {/* Description Section */}
        <Box sx={{ mt: 2 }}>
          <Accordion 
            sx={{ 
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
              border: '1px solid #e0e0e0',
              borderRadius: '8px !important',
              '&.Mui-expanded': {
                margin: '0',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                DESCRIPTION
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {product.description?.split('\\n').map((line, idx) => (
                  <li key={idx} style={{ marginBottom: 3 }}>
                    <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                      {line}
                    </Typography>
                  </li>
                ))}
              </ul>
              <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ', mt: 2 }}>
                <strong>NOTE:</strong> Please note that due to varying lighting conditions, the colors and textures shown in our product images may differ slightly from the actual garment. We make every effort to ensure accurate representation, but subtle variations may occur.
              </Typography>
              <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ', mt: 1 }}>
                Each Minicon piece is custom-crafted and print placements may vary—enhancing the individuality and uniqueness of your garment. We appreciate your understanding and thank you for celebrating the distinct character of every creation.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Wash Care Section */}
          <Accordion 
            sx={{ 
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
              border: '1px solid #e0e0e0',
              borderRadius: '8px !important',
              marginTop: 2,
              '&.Mui-expanded': {
                margin: '16px 0 0 0',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                WASH CARE
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {product.wash_care?.split('\\n').map((line, idx) => (
                  <li key={idx} style={{ marginBottom: 3 }}>
                    <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                      {line}
                    </Typography>
                  </li>
                ))}
              </ul>
            </AccordionDetails>
          </Accordion>

          {/* Product Feature Images - Added between wash care and made in india */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 2, sm: 3, md: 4 }, 
              mt: 3, 
              mb: 2,
              px: { xs: 3, sm: 4, md: 0 }
            }}
          >
            <Image
              src="/images/trust1.png"
              alt="Premium Quality"
              width={80}
              height={80}
              style={{ 
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
              
              }}
              sizes="(max-width: 600px) 80px, (max-width: 900px) 100px, 120px"
            />
            
            <Image
              src="/images/trust2.png"
              alt="Original Brand"
              width={80}
              height={80}
              style={{ 
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
              
              }}
              sizes="(max-width: 600px) 80px, (max-width: 900px) 100px, 120px"
            />
            
            <Image
              src="/images/trust3.png"
              alt="Satisfaction Guarantee"
              width={80}
              height={80}
              style={{ 
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
               
              }}
              sizes="(max-width: 600px) 80px, (max-width: 900px) 100px, 120px"
            />
          </Box>

          {/* Made in India - Added below wash care */}
          <Typography 
            variant="body1" 
            sx={{ 
              mt: 3,
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 600,
              color: '#333',
              textAlign: 'center',
            }}
          >
            Made in India
          </Typography>

          {/* Reviews Section */}
          <Box 
            id="review-section"
            sx={{ 
              mt: 4,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            {/* Review Header */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 3,
              borderBottom: '1px solid #e0e0e0',
              bgcolor: '#f9f9f9'
            }}>
              <Box>
                <Typography variant="h6" sx={{ 
                  fontFamily: '"Montserrat", sans-serif', 
                  fontWeight: 600,
                  mb: 1
                }}>
                  Reviews for {product.title}
                </Typography>
                {reviewCount > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarRating rating={Math.round(averageRating)} readOnly size="small" />
                    <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Montserrat", sans-serif' }}>
                      {averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>


            {/* Add/Edit Review Section - First Row */}
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ 
                fontFamily: '"Montserrat", sans-serif', 
                fontWeight: 600,
                mb: 3
              }}>
                {userExistingReview ? 'Edit Your Review' : 'Add Your Review'}
              </Typography>
              
              {!user ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please login to submit a review
                </Alert>
              ) : (
                <>
                  {userExistingReview && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      You have already reviewed this product. You can edit your review below.
                    </Alert>
                  )}
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: '"Montserrat", sans-serif' }}>
                      Rate this product *
                    </Typography>
                    <StarRating
                      rating={userReviewRating}
                      onRatingChange={setUserReviewRating}
                      size="large"
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: '"Montserrat", sans-serif' }}>
                      Write a review (optional)
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      fullWidth
                      placeholder="Share your thoughts about this product..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: '"Montserrat", sans-serif'
                        }
                      }}
                    />
                  </Box>

                  {reviewError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {reviewError}
                    </Alert>
                  )}

                  {reviewSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      {reviewSuccess}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    {userExistingReview && (
                      <Button
                        onClick={handleDeleteReview}
                        disabled={reviewSubmitting}
                        color="error"
                        variant="outlined"
                        sx={{
                          fontFamily: '"Montserrat", sans-serif',
                          textTransform: 'none'
                        }}
                      >
                        Delete Review
                      </Button>
                    )}
                    <Button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || userReviewRating === 0}
                      variant="contained"
                      sx={{
                        fontFamily: '"Montserrat", sans-serif',
                        textTransform: 'none'
                      }}
                    >
                      {reviewSubmitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : userExistingReview ? (
                        'Update Review'
                      ) : (
                        'Submit Review'
                      )}
                    </Button>
                  </Box>
                </>
              )}
            </Box>

            {/* View Reviews Section - Second Row */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ 
                fontFamily: '"Montserrat", sans-serif', 
                fontWeight: 600,
                mb: 3
              }}>
                All Reviews ({reviewCount})
              </Typography>
              
              {reviewsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reviews.length === 0 ? (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    textAlign: 'center', 
                    py: 4, 
                    color: '#666',
                    fontFamily: '"Montserrat", sans-serif'
                  }}
                >
                  No reviews yet. Be the first to review this product!
                </Typography>
              ) : (
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {reviews.map((review: any) => (
                    <Paper
                      key={review.id}
                      elevation={0}
                      sx={{
                        p: { xs: 2, md: 3 },
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        backgroundColor: review.user_id === user?.id ? '#f8f9fa' : 'white'
                      }}
                    >
                      {/* Mobile layout for xs and sm screens */}
                      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        {/* First row: user name and star rating */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: review.comment ? 1 : 0.5 }}>
                          <Typography variant="subtitle2" sx={{ 
                            fontFamily: '"Montserrat", sans-serif', 
                            fontWeight: 600,
                            fontSize: '0.9rem'
                          }}>
                            {review.user_name}
                          </Typography>
                          <StarRating rating={review.rating} readOnly size="small" />
                          {review.user_id === user?.id && (
                            <Chip
                              label="Your Review"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: '20px', ml: 'auto' }}
                            />
                          )}
                        </Box>
                        
                        {/* Second row: comment on left, date on right */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <Box sx={{ flex: 1, mr: 1 }}>
                            {review.comment && (
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Montserrat", sans-serif', 
                                color: '#333',
                                fontSize: '0.85rem',
                                lineHeight: 1.3
                              }}>
                                {review.comment}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ 
                            color: '#666',
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}>
                            {formatDate(review.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Desktop layout for md and larger screens */}
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600 }}>
                              {review.user_name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <StarRating rating={review.rating} readOnly size="small" />
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {formatDate(review.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                          {review.user_id === user?.id && (
                            <Chip
                              label="Your Review"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                        {review.comment && (
                          <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif', color: '#333' }}>
                            {review.comment}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Size Chart Modal */}
        <Dialog
          open={sizeChartOpen}
          onClose={handleSizeChartClose}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 2,
            }
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleSizeChartClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                zIndex: 1,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <DialogContent sx={{ p: 0 }}>
              {product.size_chart_image && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 'auto',
                    minHeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'white',
                  }}
                >
                  <Image
                    src={getFormattedOptimizedImageSrc(product.size_chart_image)}
                    alt="Size Chart"
                    width={800}
                    height={600}
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                    quality={70}
                  />
                </Box>
              )}
            </DialogContent>
          </Box>
        </Dialog>


        {/* Success Notification */}
        <Snackbar
          open={showNotification}
          autoHideDuration={3000}
          onClose={() => setShowNotification(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: 2 }}
        >
          <Alert 
            onClose={() => setShowNotification(false)} 
            severity="success" 
            variant="filled"
            sx={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 500,
              '& .MuiAlert-message': {
                padding: '4px 0',
              }
            }}
          >
            Item added to cart successfully
          </Alert>
        </Snackbar>
      </Box>
    </Box>

    {/* Suggested Products Section - Full Width at Bottom */}
    {!loading && product && (suggestedProducts.length > 0 || suggestedLoading) && (
      <Box sx={{ width: '100%', bgcolor: '#f9f9f9', py: 6 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: '"Montserrat", sans-serif', 
              fontWeight: 700, 
              textAlign: 'center', 
              mb: 4,
              color: '#222'
            }}
          >
            Suggested for you
          </Typography>
          
          {suggestedLoading ? (
            <>
              {/* Mobile and Small Screens - Grid Layout Skeleton */}
              <Box 
                sx={{ 
                  display: { xs: 'block', md: 'none' }
                }}
              >
                <Grid container spacing={{ xs: 0.5, sm: 1 }} justifyContent="center">
                  {[...Array(6)].map((_, index) => (
                    <Grid item xs={6} sm={6} key={index}>
                      <Box sx={{ width: '100%', height: 400 }}>
                        <Skeleton 
                          variant="rectangular" 
                          width="100%" 
                          height="85%" 
                          sx={{ borderRadius: 2, mb: 1 }} 
                        />
                        <Skeleton variant="text" width="80%" height={24} />
                        <Skeleton variant="text" width="60%" height={20} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Desktop and Laptop Screens - Horizontal Scroll Skeleton */}
              <Box 
                sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  gap: 0, 
                  overflowX: 'auto',
                  pb: 2,
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'grey.200',
                    borderRadius: 4,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'grey.400',
                    borderRadius: 4,
                    '&:hover': {
                      bgcolor: 'grey.500',
                    },
                  },
                }}
              >
                {[...Array(6)].map((_, index) => (
                  <Box key={index} sx={{ minWidth: { md: 280 }, height: 400, flexShrink: 0 }}>
                    <Skeleton 
                      variant="rectangular" 
                      width="100%" 
                      height="85%" 
                      sx={{ borderRadius: 2, mb: 1 }} 
                    />
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="60%" height={20} />
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <>
              {/* Mobile and Small Screens - Grid Layout */}
              <Box 
                sx={{ 
                  display: { xs: 'block', md: 'none' }
                }}
              >
                <Grid container spacing={{ xs: 0.5, sm: 1 }} justifyContent="center">
                  {suggestedProducts.map((suggestedProduct) => (
                    <Grid item xs={6} sm={6} key={suggestedProduct.id}>
                      <ProductCard 
                        product={suggestedProduct}
                        onWishlistChange={(productId, isWished) => {
                          // Update suggested products wishlist state if needed
                          setSuggestedProducts(prev => 
                            prev.map(p => p.id === productId ? {...p, isWished} : p)
                          );
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Desktop and Laptop Screens - Horizontal Scroll with Minimal Gap */}
              <Box 
                sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  gap: 0, 
                  overflowX: 'auto',
                  pb: 2,
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'grey.200',
                    borderRadius: 4,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'grey.400',
                    borderRadius: 4,
                    '&:hover': {
                      bgcolor: 'grey.500',
                    },
                  },
                }}
              >
                {suggestedProducts.map((suggestedProduct) => (
                  <Box 
                    key={suggestedProduct.id}
                    sx={{ 
                      minWidth: { md: 280 },
                      flexShrink: 0
                    }}
                  >
                    <ProductCard 
                      product={suggestedProduct}
                      onWishlistChange={(productId, isWished) => {
                        // Update suggested products wishlist state if needed
                        setSuggestedProducts(prev => 
                          prev.map(p => p.id === productId ? {...p, isWished} : p)
                        );
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Container>
      </Box>
    )}

  </>
  );
};

export default function PreCheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreCheckout />
    </Suspense>
  );
}