import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Listing } from '@/lib/models/Listing';
import { Review } from '@/lib/models/Review';
import { isAdmin } from '@/lib/auth';
import { User } from '@/lib/models/User';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  console.log('🗑️ Admin deleting listing:', id);

  try {
    await connectToDatabase();

    // Delete associated reviews first
    await Review.deleteMany({ listingId: id });
    
    // Delete the listing
    await Listing.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Listing and its reviews deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
