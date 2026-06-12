import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { listingSchema } from '@/lib/validators';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Listing } from '@/lib/models/Listing';
import { Review } from '@/lib/models/Review';
import { ZodError } from 'zod';
import { calculateDistance } from '@/lib/utils/geo';
import { generateReviewSummary } from '@/lib/utils/ai';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const listingType = searchParams.get('type');
    const isOwnerListing = searchParams.get('isOwnerListing') === 'true';
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query: any = { status: 'available' };
    const isOwnerListingParam = searchParams.get('isOwnerListing');
    if (isOwnerListingParam !== null) {
      query.isOwnerListing = isOwnerListingParam === 'true';
    }

    if (listingType) {
      query.listingType = listingType;
    }

    if (search) {
      query.$or = [
        { pgName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const listings = await Listing.find(query)
      .populate('userId', 'name hostelName roomNumber role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Listing.countDocuments(query);

    // Filter sensitive info for student listings not in handoverMode or roommate
    const sanitizedListings = listings.map(l => {
      const listing = l.toObject();
      if (!listing.isOwnerListing && !listing.handoverMode && listing.listingType !== 'roommate') {
        // Keep it anonymous - remove user details except location name
        const populatedUser = listing.userId as any;
        const hostelName = populatedUser?.hostelName;
        (listing as any).userId = hostelName ? { hostelName } : undefined;
      }
      return listing;
    });

    return NextResponse.json({
      data: sanitizedListings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
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
    const validated = listingSchema.parse(body);

    await connectToDatabase();

    // Check if user is verified
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.personalEmailVerified) {
      return NextResponse.json({ error: 'Please verify your personal email before creating a listing.' }, { status: 403 });
    }

    if (!user.collegeEmailVerified) {
      return NextResponse.json({ error: 'Institutional (College) email verification is required to create listings. Please verify your college identity in your profile.' }, { status: 403 });
    }

    const userRole = user.role?.toUpperCase() || 'STUDENT';

    if (userRole === 'GUEST') {
      return NextResponse.json({ error: 'Please verify your student identity in your profile to create listings' }, { status: 403 });
    }

    const isOwnerListing = userRole === 'OWNER';

    // Validate PG Rating inputs
    if (userRole === 'STUDENT' && validated.listingType === 'pg') {
      if (!body.rating || !body.comment) {
        return NextResponse.json({ error: 'Rating and comment are required for PG reviews' }, { status: 400 });
      }
    }

    // Unique PG Listing Enforcement (Prevent duplicates in same building/area)
    // IMPORTANT: Handover listings are BYPASSED as multiple students can live in one building.
    // Only 'pg' types (Student Ratings and Owner Listings) are restricted to 1 per location.
    if (validated.listingType === 'pg') {
      const existingPgListings = await Listing.find({
        listingType: 'pg',
        status: 'available'
      });

      const duplicate = existingPgListings.find(l => {
        if (!l.coordinates || l.coordinates.lat === undefined || l.coordinates.lng === undefined) {
          return false;
        }
        
        const d = calculateDistance(
          validated.lat,
          validated.lng,
          l.coordinates.lat,
          l.coordinates.lng
        );
        // If distance is very close (< 50m), it's likely the same building/property
        return d <= 50;
      });

      if (duplicate) {
        return NextResponse.json({ 
          error: 'A listing at this location already exists. To keep the community organized, please add your review or details to the existing listing instead of creating a duplicate.',
          existingListingId: duplicate._id 
        }, { status: 409 });
      }
    }

    // Create listing
    const newListing = new Listing({
      userId: payload.userId,
      listingType: validated.listingType,
      pgName: validated.pgName,
      roomDetails: validated.roomDetails,
      price: validated.price,
      availableDate: validated.availableDate ? new Date(validated.availableDate) : new Date(),
      legacyBundle: validated.listingType === 'handover' ? validated.legacyBundle : undefined,
      address: validated.address,
      amenities: validated.amenities,
      coordinates: {
        lat: validated.lat,
        lng: validated.lng,
      },
      totalRooms: validated.totalRooms,
      availableRooms: validated.availableRooms ?? validated.totalRooms,
      status: 'available',
      isOwnerListing: isOwnerListing,
      handoverMode: !isOwnerListing ? (validated.handoverMode ?? false) : true,
      sharingType: validated.sharingType,
      foodIncluded: validated.foodIncluded,
      billsIncluded: validated.billsIncluded,
      genderCategory: validated.genderCategory,
      images: validated.images || [],
    });

    await newListing.save();

    // Automatically create a review if this is a PG rating from a student
    if (userRole === 'STUDENT' && validated.listingType === 'pg' && body.rating && body.comment) {
      const aiSummary = await generateReviewSummary([{
        rating: body.rating,
        wifiRating: body.wifiRating,
        foodRating: body.foodRating,
        securityRating: body.securityRating,
        behaviorRating: body.behaviorRating,
        backupRating: body.backupRating,
        responsivenessRating: body.responsivenessRating,
        comment: body.comment,
      }]);

      const newReview = new Review({
        userId: payload.userId,
        listingId: newListing._id,
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
      
      newListing.reviewCount = 1;
      newListing.aiSummary = aiSummary || undefined;
      await newListing.save();
    }

    return NextResponse.json(
      {
        message: 'Listing created successfully',
        listing: newListing,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Listing creation error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}

