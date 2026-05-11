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

    const listing = await Listing.findById(id).populate('userId', 'name hostelName roomNumber');
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

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

    // Update listing
    Object.assign(listing, {
      roomDetails: validated.roomDetails,
      price: validated.price,
      availableDate: new Date(validated.availableDate),
      legacyBundle: validated.legacyBundle,
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

    await Listing.deleteOne({ _id: id });

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Listing deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
