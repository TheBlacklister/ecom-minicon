"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StarRating } from '../StarRating';
import { Review } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../AuthProvider';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  productTitle: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  onClose,
  productId,
  productTitle
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userExistingReview, setUserExistingReview] = useState<Review | null>(null);

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?productId=${productId}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews || []);
        
        // Check if current user has already reviewed this product
        if (user) {
          const existingReview = data.reviews?.find((review: Review) => review.user_id === user.id);
          setUserExistingReview(existingReview || null);
          if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment || '');
          }
        }
      } else {
        setError(data.error || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, user]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setRating(0);
      setComment('');
      setError('');
      setSuccess('');
      setActiveTab('add');
      fetchReviews();
    }
  }, [open, productId, fetchReviews]);

  const handleSubmitReview = async () => {
    if (!user) {
      setError('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      };

      const method = userExistingReview ? 'PUT' : 'POST';
      const body = userExistingReview 
        ? { reviewId: userExistingReview.id, rating, comment }
        : { productId, rating, comment };

      const response = await fetch('/api/reviews', {
        method,
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(userExistingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        setRating(0);
        setComment('');
        fetchReviews(); // Refresh reviews
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userExistingReview || !user) return;

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${session?.access_token}`
      };

      const response = await fetch(`/api/reviews?reviewId=${userExistingReview.id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setSuccess('Review deleted successfully!');
        setRating(0);
        setComment('');
        setUserExistingReview(null);
        fetchReviews(); // Refresh reviews
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review');
    } finally {
      setSubmitting(false);
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600 }}>
            Reviews for {productTitle}
          </Typography>
          {reviews.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <StarRating rating={Math.round(averageRating)} readOnly size="small" />
              <Typography variant="body2" sx={{ color: '#666' }}>
                {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </Typography>
            </Box>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'grey.500' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Tab Navigation */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
        <Button
          onClick={() => setActiveTab('add')}
          sx={{
            flex: 1,
            py: 2,
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: activeTab === 'add' ? 600 : 400,
            color: activeTab === 'add' ? 'primary.main' : 'text.secondary',
            borderBottom: activeTab === 'add' ? '2px solid' : 'none',
            borderBottomColor: 'primary.main',
            borderRadius: 0,
            textTransform: 'none'
          }}
        >
          {userExistingReview ? 'Edit Review' : 'Add Review'}
        </Button>
        <Button
          onClick={() => setActiveTab('view')}
          sx={{
            flex: 1,
            py: 2,
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: activeTab === 'view' ? 600 : 400,
            color: activeTab === 'view' ? 'primary.main' : 'text.secondary',
            borderBottom: activeTab === 'view' ? '2px solid' : 'none',
            borderBottomColor: 'primary.main',
            borderRadius: 0,
            textTransform: 'none'
          }}
        >
          View Reviews ({reviews.length})
        </Button>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Add/Edit Review Tab */}
        {activeTab === 'add' && (
          <Box>
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
                    rating={rating}
                    onRatingChange={setRating}
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
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: '"Montserrat", sans-serif'
                      }
                    }}
                  />
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}
              </>
            )}
          </Box>
        )}

        {/* View Reviews Tab */}
        {activeTab === 'view' && (
          <Box>
            {loading ? (
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
                {reviews.map((review) => (
                  <Paper
                    key={review.id}
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      backgroundColor: review.user_id === user?.id ? '#f8f9fa' : 'white'
                    }}
                  >
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
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {activeTab === 'add' && user && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            {userExistingReview && (
              <Button
                onClick={handleDeleteReview}
                disabled={submitting}
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
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={onClose}
              disabled={submitting}
              sx={{
                fontFamily: '"Montserrat", sans-serif',
                textTransform: 'none'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
              variant="contained"
              sx={{
                fontFamily: '"Montserrat", sans-serif',
                textTransform: 'none'
              }}
            >
              {submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : userExistingReview ? (
                'Update Review'
              ) : (
                'Submit Review'
              )}
            </Button>
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
};