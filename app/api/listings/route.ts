import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { listingSchema } from '@/lib/validators';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Listing } from '@/lib/models/Listing';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const listingType = searchParams.get('type');
    const isOwnerListing = searchParams.get('isOwnerListing') === 'true';
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query: any = { status: 'available', isOwnerListing };
    if (listingType) {
      query.listingType = listingType;
    }

    const listings = await Listing.find(query)
      .populate('userId', 'name hostelName roomNumber role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Listing.countDocuments(query);

    // Filter sensitive info for student listings not in handoverMode
    const sanitizedListings = listings.map(l => {
      const listing = l.toObject();
      if (!listing.isOwnerListing && !listing.handoverMode) {
        // Keep it anonymous - remove user details except maybe university info if we had it
        delete listing.userId;
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
    if (!user || !user.verified) {
      return NextResponse.json({ error: 'Only verified users can create listings' }, { status: 403 });
    }

    if (user.role === 'GUEST') {
      return NextResponse.json({ error: 'Guests cannot create listings' }, { status: 403 });
    }

    const isOwnerListing = user.role === 'OWNER';

    // Unique PG Listing Enforcement for Students
    if (!isOwnerListing && validated.listingType === 'pg') {
      const existingListing = await Listing.findOne({
        isOwnerListing: false,
        listingType: 'pg',
        coordinates: {
          lat: validated.lat,
          lng: validated.lng
        }
      });

      if (existingListing) {
        return NextResponse.json({ 
          error: 'A listing at this location already exists. Please add a review to the existing listing instead.',
          existingListingId: existingListing._id 
        }, { status: 409 });
      }
    }

    // Create listing
    const newListing = new Listing({
      userId: payload.userId,
      listingType: validated.listingType,
      roomDetails: validated.roomDetails,
      price: validated.price,
      availableDate: new Date(validated.availableDate),
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
    });

    await newListing.save();

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
