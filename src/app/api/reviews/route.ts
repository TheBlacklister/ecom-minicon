import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { user: null, supabase: null, error: new Error('Auth session missing!') };
  }
  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, supabase: null, error };
  }
  return { user: data.user, supabase, error: null };
}

// GET /api/reviews - Get reviews for a product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const { supabase } = await getUser(request);
    
    // For getting reviews, we don't need authentication, but we need supabase client
    // Use anonymous client if no auth
    const supabaseClient = supabase || createSupabaseServerClient();

    const { data: reviews, error } = await supabaseClient
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        user_id
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Get user names for reviews
    const userIds = [...new Set(reviews?.map(r => r.user_id) || [])];
    let userProfiles: any = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      
      userProfiles = profiles?.reduce((acc: any, profile: any) => {
        acc[profile.user_id] = profile.name || 'Anonymous';
        return acc;
      }, {}) || {};
    }

    // Format the response to include user name
    const formattedReviews = reviews?.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_name: userProfiles[review.user_id] || 'Anonymous',
      user_id: review.user_id
    })) || [];

    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reviews - Add a new review
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getUser(request);
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating) {
      return NextResponse.json({ error: 'Product ID and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if user already reviewed this product
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database check error:', checkError);
      return NextResponse.json({ error: 'Failed to check existing review' }, { status: 500 });
    }

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }

    // Insert new review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        product_id: productId,
        rating: parseInt(rating),
        comment: comment || null
      })
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
    }

    // Get user name
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_name: userProfile?.name || 'Anonymous',
      user_id: user.id
    };

    return NextResponse.json({ review: formattedReview }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/reviews - Update an existing review
export async function PUT(request: NextRequest) {
  const { user, supabase, error: authError } = await getUser(request);
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reviewId, rating, comment } = body;

    if (!reviewId || !rating) {
      return NextResponse.json({ error: 'Review ID and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Update review (RLS ensures user can only update their own review)
    const { data: review, error: updateError } = await supabase
      .from('reviews')
      .update({
        rating: parseInt(rating),
        comment: comment || null
      })
      .eq('id', reviewId)
      .eq('user_id', user.id) // Double check for security
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    if (!review) {
      return NextResponse.json({ error: 'Review not found or unauthorized' }, { status: 404 });
    }

    // Get user name
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_name: userProfile?.name || 'Anonymous',
      user_id: user.id
    };

    return NextResponse.json({ review: formattedReview });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reviews - Delete a review
export async function DELETE(request: NextRequest) {
  const { user, supabase, error: authError } = await getUser(request);
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    // Delete review (RLS ensures user can only delete their own review)
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id); // Double check for security

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}