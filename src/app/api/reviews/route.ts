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
    
    console.log('=== DEBUG START: Profile fetching ===');
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('- SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('- User IDs to fetch:', userIds);
    
    if (userIds.length > 0) {
      try {
        // Use service role client for admin access to bypass RLS
        const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log('Service key found:', !!serviceKey);
        console.log('Service key length:', serviceKey ? serviceKey.length : 0);
        console.log('Service key prefix:', serviceKey ? serviceKey.substring(0, 20) + '...' : 'none');
        
        if (!serviceKey) {
          console.error('❌ CRITICAL: No service key found in environment variables');
          console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
          throw new Error('Service key not configured');
        }
        
        console.log('✅ Creating service role client...');
        const serviceRoleClient = createSupabaseServerClient(serviceKey);
        
        console.log('📋 Querying profiles table...');
        // Try to get profiles data first
        const { data: profiles, error: profileError } = await serviceRoleClient
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', userIds);
        
        console.log('📊 Profiles query completed:');
        console.log('- Error:', profileError);
        console.log('- Profiles found:', profiles ? profiles.length : 0);
        console.log('- Profiles data:', profiles);
        
        if (profileError) {
          console.error('❌ Profile query error details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          });
          throw profileError;
        }
        
        if (profiles && profiles.length > 0) {
          console.log('✅ Processing profiles normally...');
          // Process profiles normally
          userProfiles = profiles.reduce((acc: any, profile: any) => {
            let displayName = 'Anonymous User';
            
            console.log('👤 Processing profile:', {
              user_id: profile.user_id,
              name: profile.name,
              email: profile.email,
              hasName: !!(profile.name && profile.name.trim()),
              hasEmail: !!(profile.email && profile.email.trim())
            });
            
            if (profile.name && profile.name.trim()) {
              displayName = profile.name.trim();
              console.log('✅ Using name for', profile.user_id, ':', displayName);
            } else if (profile.email && profile.email.trim()) {
              const emailPrefix = profile.email.split('@')[0];
              displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
              console.log('📧 Using email prefix for', profile.user_id, ':', displayName);
            } else {
              console.log('⚠️ No name or email found for', profile.user_id, ', using Anonymous User');
            }
            
            acc[profile.user_id] = displayName;
            return acc;
          }, {});
          
          // Add any missing users with fallback
          userIds.forEach(userId => {
            if (!userProfiles[userId]) {
              console.log('⚠️ Missing profile for user', userId, ', adding Anonymous User');
              userProfiles[userId] = 'Anonymous User';
            }
          });
        } else {
          console.log('⚠️ No profiles found in database - all users will be Anonymous');
          // No profiles found - set all to Anonymous User
          userProfiles = userIds.reduce((acc: any, userId: string) => {
            acc[userId] = 'Anonymous User';
            return acc;
          }, {});
        }
      } catch (error) {
        console.error('❌ CRITICAL ERROR fetching user profiles:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
        // Fallback: set all users to Anonymous User
        userProfiles = userIds.reduce((acc: any, userId: string) => {
          acc[userId] = 'Anonymous User';
          return acc;
        }, {});
      }
      
      console.log('🏁 Final userProfiles mapping:', userProfiles);
      console.log('=== DEBUG END: Profile fetching ===');
    } else {
      console.log('ℹ️ No user IDs found, skipping profile fetch');
    }

    // Format the response to include user name
    const formattedReviews = reviews?.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_name: userProfiles[review.user_id] || 'Anonymous User',
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
    console.log('=== DEBUG: POST - Fetching user profile for', user.id, '===');
    const { data: userProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('user_id', user.id)
      .single();

    console.log('POST Profile fetch result:', { userProfile, profileFetchError });

    // Generate display name with same logic as GET
    let displayName = 'Anonymous User';
    if (userProfile?.name && userProfile.name.trim()) {
      displayName = userProfile.name.trim();
      console.log('✅ POST: Using name:', displayName);
    } else if (userProfile?.email && userProfile.email.trim()) {
      const emailPrefix = userProfile.email.split('@')[0];
      displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      console.log('📧 POST: Using email prefix:', displayName);
    } else {
      console.log('⚠️ POST: No name or email found, using Anonymous User');
    }

    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_name: displayName,
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
    console.log('=== DEBUG: PUT - Fetching user profile for', user.id, '===');
    const { data: userProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('user_id', user.id)
      .single();

    console.log('PUT Profile fetch result:', { userProfile, profileFetchError });

    // Generate display name with same logic as GET
    let displayName = 'Anonymous User';
    if (userProfile?.name && userProfile.name.trim()) {
      displayName = userProfile.name.trim();
      console.log('✅ PUT: Using name:', displayName);
    } else if (userProfile?.email && userProfile.email.trim()) {
      const emailPrefix = userProfile.email.split('@')[0];
      displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      console.log('📧 PUT: Using email prefix:', displayName);
    } else {
      console.log('⚠️ PUT: No name or email found, using Anonymous User');
    }

    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_name: displayName,
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