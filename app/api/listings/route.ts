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
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query: any = { status: 'available' };
    if (listingType) {
      query.listingType = listingType;
    }

    const listings = await Listing.find(query)
      .populate('userId', 'name hostelName roomNumber role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Listing.countDocuments(query);

    return NextResponse.json({
      data: listings,
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

    if (user.role === 'guest') {
      return NextResponse.json({ error: 'Guests cannot create listings' }, { status: 403 });
    }

    // Determine listing type based on role
    const listingType = user.role === 'student' ? 'handover' : 'pg';

    // Create listing
    const newListing = new Listing({
      userId: payload.userId,
      listingType: listingType,
      roomDetails: validated.roomDetails,
      price: validated.price,
      availableDate: new Date(validated.availableDate),
      legacyBundle: listingType === 'handover' ? validated.legacyBundle : undefined,
      address: listingType === 'pg' ? validated.address : undefined,
      amenities: listingType === 'pg' ? validated.amenities : undefined,
      coordinates: {
        lat: validated.lat,
        lng: validated.lng,
      },
      totalRooms: listingType === 'pg' ? validated.totalRooms : undefined,
      availableRooms: listingType === 'pg' ? (validated.availableRooms ?? validated.totalRooms) : undefined,
      status: 'available',
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
