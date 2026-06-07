import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Listing } from '@/lib/models/Listing';
import { Review } from '@/lib/models/Review';
import { isAdmin } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  console.log('🗑️ Admin deleting user:', id);

  try {
    await connectToDatabase();

    // Prevent deleting the admin itself
    const userToDelete = await User.findById(id);
    if (userToDelete?.email === 'admin@verisitee.com') {
      return NextResponse.json({ error: 'Cannot delete the Super Admin' }, { status: 400 });
    }

    // Delete user's listings
    await Listing.deleteMany({ userId: id });
    
    // Delete user's reviews
    await Review.deleteMany({ userId: id });

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
