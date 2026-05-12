import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { reviewSchema } from '@/lib/validators';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Review } from '@/lib/models/Review';
import { ZodError } from 'zod';

import { Listing } from '@/lib/models/Listing';
import { calculateDistance } from '@/lib/utils/geo';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Do NOT populate userId to maintain anonymity
    const reviews = await Review.find({ listingId })
      .select('rating comment createdAt')
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
    const validated = reviewSchema.parse(body);

    await connectToDatabase();

    // Only verified students can rate
    const user = await User.findById(payload.userId);
    if (!user || !user.verified || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only verified students can rate listings' }, { status: 403 });
    }

    // Geofence Check
    const listing = await Listing.findById(validated.listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Prevent owners from being rated/reviewed by themselves? 
    // Wait, owners are blocked from interacting with the rating system entirely.
    // "Owners are hard-blocked from interacting with the rating/review system. They cannot rate their own or others' properties."
    // This is handled by the user.role !== 'STUDENT' check above.

    // Prevent users from rating their own listings
    if (listing.userId.toString() === payload.userId) {
      return NextResponse.json({ error: 'You cannot rate your own listing' }, { status: 403 });
    }

    const distance = calculateDistance(
      validated.lat,
      validated.lng,
      listing.coordinates.lat,
      listing.coordinates.lng
    );

    const isGeofenceVerified = distance <= 100;

    if (!isGeofenceVerified) {
      return NextResponse.json(
        { error: `You must be within 100 meters of the location to leave a review. (Current distance: ${Math.round(distance)}m)` },
        { status: 403 }
      );
    }

    // Check if student already reviewed this listing
    const existingReview = await Review.findOne({
      userId: payload.userId,
      listingId: validated.listingId,
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 400 });
    }

    // Create review
    const newReview = new Review({
      userId: payload.userId,
      listingId: validated.listingId,
      rating: validated.rating,
      comment: validated.comment,
      geofenceVerified: isGeofenceVerified,
    });

    await newReview.save();

    // Update Listing Review Count
    await Listing.findByIdAndUpdate(validated.listingId, {
      $inc: { reviewCount: 1 }
    });

    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        review: {
          id: newReview._id,
          listingId: newReview.listingId,
          rating: newReview.rating,
          comment: newReview.comment,
          geofenceVerified: newReview.geofenceVerified,
          createdAt: newReview.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Review creation error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
