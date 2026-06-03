import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';
import { Listing } from '../lib/models/Listing';
import { Review } from '../lib/models/Review';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanupListings() {
  try {
    await connectToDatabase();
    
    const demoUser = await User.findOne({ email: 'demo@gmail.com' });
    
    if (!demoUser) {
      console.error('❌ User demo@gmail.com not found. Aborting cleanup to prevent accidental total wipe.');
      process.exit(1);
    }

    const demoUserId = demoUser._id;
    console.log(`✅ Found demo user: ${demoUser.email} (${demoUserId})`);

    // Count listings to be deleted
    const totalListings = await Listing.countDocuments();
    const demoListingsCount = await Listing.countDocuments({ userId: demoUserId });
    const toDeleteCount = totalListings - demoListingsCount;

    console.log(`📊 Stats:`);
    console.log(`   - Total Listings: ${totalListings}`);
    console.log(`   - Demo Listings:  ${demoListingsCount}`);
    console.log(`   - To Delete:      ${toDeleteCount}`);

    if (toDeleteCount === 0) {
      console.log('✨ No listings to delete.');
      process.exit(0);
    }

    // Get IDs of listings to be deleted for review cleanup
    const listingsToDelete = await Listing.find({ userId: { $ne: demoUserId } }).select('_id');
    const listingIds = listingsToDelete.map(l => l._id);

    // Delete Reviews associated with these listings
    const reviewDeleteResult = await Review.deleteMany({ listingId: { $in: listingIds } });
    console.log(`🗑️ Deleted ${reviewDeleteResult.deletedCount} reviews associated with these listings.`);

    // Delete Listings
    const listingDeleteResult = await Listing.deleteMany({ userId: { $ne: demoUserId } });
    console.log(`🗑️ Deleted ${listingDeleteResult.deletedCount} listings.`);

    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupListings();
