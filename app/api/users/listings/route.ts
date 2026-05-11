import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { Listing } from '@/lib/models/Listing';

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);

    await connectToDatabase();

    const listings = await Listing.find({ userId: payload.userId }).sort({ createdAt: -1 });

    return NextResponse.json(listings);
  } catch (error) {
    console.error('User listings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch your listings' }, { status: 500 });
  }
}
