import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Review } from '@/lib/models/Review';
import { Listing } from '@/lib/models/Listing';
import { isAdmin } from '@/lib/auth';
import { User } from '@/lib/models/User';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  console.log('🗑️ Admin deleting review:', id);

  try {
    await connectToDatabase();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Decrement review count in listing
    await Listing.findByIdAndUpdate(review.listingId, {
      $inc: { reviewCount: -1 }
    });
    
    // Delete the review
    await Review.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
