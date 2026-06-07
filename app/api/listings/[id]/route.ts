import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { listingSchema } from '@/lib/validators';
import { extractTokenFromHeader, verifyToken, isAdmin } from '@/lib/auth';
import { Listing } from '@/lib/models/Listing';
import { Review } from '@/lib/models/Review';
import { User } from '@/lib/models/User';
import { generateReviewSummary } from '@/lib/utils/ai';

import { ZodError } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await connectToDatabase();

    const listingDoc = await Listing.findById(id).populate('userId', 'name hostelName roomNumber role email phoneNumber');
    if (!listingDoc) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = listingDoc.toObject();
    const populatedUser = listing.userId as any;
    
    // Fallback: If isOwnerListing is not set but user is an OWNER, treat as owner listing
    const actualIsOwnerListing = listing.isOwnerListing || populatedUser?.role === 'OWNER';

    // Check if the requester is the owner of the listing
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    let isRequesterTheOwner = false;
    if (token) {
      try {
        const payload = verifyToken(token);
        const ownerId = populatedUser?._id?.toString() || populatedUser?.toString();
        isRequesterTheOwner = ownerId === payload.userId;
      } catch (e) {
        // Invalid token, treat as guest
      }
    }

    // Filter sensitive info for student listings not in handoverMode or roommate, unless requester is the owner
    if (!isRequesterTheOwner && !actualIsOwnerListing && !listing.handoverMode && listing.listingType !== 'roommate') {
      const hostelName = populatedUser?.hostelName;
      // Reassign instead of delete to satisfy TS interface
      (listing as any).userId = hostelName ? { hostelName } : undefined;
    }

    // Return the updated isOwnerListing status
    listing.isOwnerListing = actualIsOwnerListing;

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Listing fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const { id } = await params;
    const body = await req.json();
    const validated = listingSchema.parse(body);

    await connectToDatabase();

    // Check ownership (Bypass if Admin)
    const isUserAdmin = await isAdmin(req);
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (!isUserAdmin && listing.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'You can only edit your own listings' }, { status: 403 });
    }

    // Lock Location for Student Listings (Bypass if Admin)
    if (!isUserAdmin && !listing.isOwnerListing) {
      // If coordinates changed, block it
      if (validated.lat !== listing.coordinates.lat || validated.lng !== listing.coordinates.lng) {
        return NextResponse.json({ error: 'Address/Location cannot be changed after creation for student listings.' }, { status: 403 });
      }
    }

    // Prevent changing listingType after creation (Bypass if Admin)
    if (!isUserAdmin && validated.listingType !== listing.listingType) {
      return NextResponse.json({ error: 'Listing type cannot be changed after creation.' }, { status: 400 });
    }

    // Update listing
    Object.assign(listing, {
      pgName: validated.pgName,
      roomDetails: validated.roomDetails,
      price: validated.price,
      availableDate: validated.availableDate ? new Date(validated.availableDate) : listing.availableDate,
      legacyBundle: validated.legacyBundle,
      address: validated.address,
      amenities: validated.amenities,
      totalRooms: validated.totalRooms,
      availableRooms: validated.availableRooms,
      handoverMode: listing.isOwnerListing ? true : (validated.handoverMode ?? listing.handoverMode),
      sharingType: validated.sharingType,
      foodIncluded: validated.foodIncluded,
      billsIncluded: validated.billsIncluded,
      genderCategory: validated.genderCategory,
    });

    // Update coordinates for owners
    if (listing.isOwnerListing) {
      listing.coordinates = {
        lat: validated.lat,
        lng: validated.lng,
      };
    }

    if (validated.images) {
      listing.images = validated.images;
    }

    await listing.save();

    // If student and type is PG (Rating), handle review update
    const user = await User.findById(payload.userId);
    const userRole = user?.role?.toUpperCase() || 'STUDENT';

    if (userRole === 'STUDENT' && validated.listingType === 'pg' && body.rating && body.comment) {
      const existingReview = await Review.findOne({ userId: payload.userId, listingId: listing._id });
      if (existingReview) {
        existingReview.rating = body.rating;
        existingReview.wifiRating = body.wifiRating;
        existingReview.foodRating = body.foodRating;
        existingReview.securityRating = body.securityRating;
        existingReview.behaviorRating = body.behaviorRating;
        existingReview.backupRating = body.backupRating;
        existingReview.responsivenessRating = body.responsivenessRating;
        existingReview.comment = body.comment;
        await existingReview.save();
      } else {
        const newReview = new Review({
          userId: payload.userId,
          listingId: listing._id,
          rating: body.rating,
          wifiRating: body.wifiRating,
          foodRating: body.foodRating,
          securityRating: body.securityRating,
          behaviorRating: body.behaviorRating,
          backupRating: body.backupRating,
          responsivenessRating: body.responsivenessRating,
          comment: body.comment,
          geofenceVerified: true,
        });
        await newReview.save();
        listing.reviewCount = (listing.reviewCount || 0) + 1;
      }
      
      const allReviews = await Review.find({ listingId: listing._id });
      const listingAiSummary = await generateReviewSummary(allReviews);
      listing.aiSummary = listingAiSummary || undefined;
      await listing.save();
    }

    return NextResponse.json({
      message: 'Listing updated successfully',
      listing,
    });
  } catch (error: any) {
    console.error('Listing update error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const { id } = await params;

    await connectToDatabase();

    // Check ownership and delete
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'You can only delete your own listings' }, { status: 403 });
    }

    // Deletion Lock: Community Ownership Rule
    if (!listing.isOwnerListing && listing.reviewCount > 1) {
      return NextResponse.json({ 
        error: 'This listing has significant community interaction (reviews) and cannot be deleted by the publisher to maintain data integrity.' 
      }, { status: 403 });
    }

    await Listing.deleteOne({ _id: id });

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Listing deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
