import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Listing } from '@/lib/models/Listing';
import { Review } from '@/lib/models/Review';
import { Report } from '@/lib/models/Report';
import { isAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const [userCount, listingCount, reviewCount, reportCount] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Review.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
    ]);

    // Get recent activity
    const [recentUsers, recentListings, recentReviews] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role verified createdAt'),
      Listing.find().sort({ createdAt: -1 }).limit(5).select('pgName price listingType address createdAt'),
      Review.find().sort({ createdAt: -1 }).limit(5).select('rating comment createdAt'),
    ]);

    return NextResponse.json({
      stats: {
        users: userCount,
        listings: listingCount,
        reviews: reviewCount,
        reports: reportCount,
      },
      recent: {
        users: recentUsers,
        listings: recentListings,
        reviews: recentReviews,
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
