import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { reviewSchema } from '@/lib/validators';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Review } from '@/lib/models/Review';
import { Listing } from '@/lib/models/Listing';
import { calculateDistance } from '@/lib/utils/geo';
import { ZodError } from 'zod';
import { generateReviewSummary } from '@/lib/utils/ai';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Use mongoose.Types.ObjectId to ensure correct querying
    const reviews = await Review.find({ 
      listingId: new mongoose.Types.ObjectId(listingId) 
    })
      .select('rating wifiRating foodRating securityRating behaviorRating backupRating responsivenessRating comment createdAt geofenceVerified')
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const body = await req.json();
    
    // Validate request body
    const validated = reviewSchema.parse(body);

    await connectToDatabase();

    // 1. User Validation: Only verified students can rate
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.verified) {
      return NextResponse.json({ error: 'Please verify your email before leaving a review' }, { status: 403 });
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only verified students can rate listings' }, { status: 403 });
    }

    // 2. Listing Validation
    const listing = await Listing.findById(validated.listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // 3. Ownership Check: Prevent users from rating their own listings
    if (listing.userId.toString() === payload.userId) {
      return NextResponse.json({ error: 'You cannot rate your own listing' }, { status: 403 });
    }

    // 4. Geofence Check: Must be within 100m
    const distance = calculateDistance(
      validated.lat,
      validated.lng,
      listing.coordinates.lat,
      listing.coordinates.lng
    );

    const isGeofenceVerified = distance <= 50;

    if (!isGeofenceVerified) {
      return NextResponse.json(
        { 
          error: `Verification failed: You must be at the property location to leave a review. (Current distance: ${Math.round(distance)}m, required: <50m)`,
        },
        { status: 403 }
      );
    }

    // 5. Duplicate Check: One review per user per listing
    const existingReview = await Review.findOne({
      userId: payload.userId,
      listingId: validated.listingId,
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 400 });
    }

    // 6. Create Review
    const newReview = new Review({
      userId: payload.userId,
      listingId: validated.listingId,
      rating: validated.rating,
      wifiRating: validated.wifiRating,
      foodRating: validated.foodRating,
      securityRating: validated.securityRating,
      behaviorRating: validated.behaviorRating,
      backupRating: validated.backupRating,
      responsivenessRating: validated.responsivenessRating,
      comment: validated.comment,
      geofenceVerified: isGeofenceVerified,
    });

    await newReview.save();

    // Fetch all reviews for this listing to generate a combined summary
    const allReviews = await Review.find({ listingId: validated.listingId });
    
    const aiSummary = await generateReviewSummary(allReviews);

    // 7. Update Listing Analytics
    await Listing.findByIdAndUpdate(validated.listingId, {
      $inc: { reviewCount: 1 },
      aiSummary: aiSummary || undefined
    });

    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        review: {
          id: newReview._id,
          rating: newReview.rating,
          wifiRating: newReview.wifiRating,
          foodRating: newReview.foodRating,
          securityRating: newReview.securityRating,
          behaviorRating: newReview.behaviorRating,
          backupRating: newReview.backupRating,
          responsivenessRating: newReview.responsivenessRating,
          comment: newReview.comment,
          geofenceVerified: newReview.geofenceVerified,
          createdAt: newReview.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Review submission error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid Listing ID' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to submit review. Please try again later.' }, { status: 500 });
  }
}

