import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { listingSchema } from '@/lib/validators';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { Listing } from '@/lib/models/Listing';

import { ZodError } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await connectToDatabase();

    const listingDoc = await Listing.findById(id).populate('userId', 'name hostelName roomNumber role email');
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

    // Filter sensitive info for student listings not in handoverMode, unless requester is the owner
    if (!isRequesterTheOwner && !actualIsOwnerListing && !listing.handoverMode) {
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

    // Check ownership
    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'You can only edit your own listings' }, { status: 403 });
    }

    // Lock Location for Student Listings
    if (!listing.isOwnerListing) {
      // If coordinates changed, block it
      if (validated.lat !== listing.coordinates.lat || validated.lng !== listing.coordinates.lng) {
        return NextResponse.json({ error: 'Address/Location cannot be changed after creation for student listings.' }, { status: 403 });
      }
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
    });

    await listing.save();

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
