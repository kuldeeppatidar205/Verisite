import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function clearListings() {
  const { connectToDatabase } = require('../lib/db');
  const { Listing } = require('../lib/models/Listing');

  console.log('🧹 Verisite - Clearing All Listings');
  console.log('====================================\n');

  try {
    await connectToDatabase();

    const result = await Listing.deleteMany({});
    console.log(`✓ Successfully deleted ${result.deletedCount} listing(s).`);

    console.log('\n✓ All listings have been removed. Your user accounts remain intact.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to clear listings:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

clearListings();
