import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';
import { Listing } from '../lib/models/Listing';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function clearDatabase() {
  console.log('🧹 PurePG - Clearing User Accounts & Listings');
  console.log('================================================\n');

  try {
    await connectToDatabase();

    // Delete all listings first (to avoid orphaned listings)
    const listingResult = await Listing.deleteMany({});
    console.log(`✓ Deleted ${listingResult.deletedCount} listing(s).`);

    // Delete all users
    const userResult = await User.deleteMany({});
    console.log(`✓ Deleted ${userResult.deletedCount} user account(s).`);

    console.log('\n✓ Database is now clean!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to clear database:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

clearDatabase();
