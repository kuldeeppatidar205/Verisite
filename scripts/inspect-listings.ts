import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';
import { Listing } from '../lib/models/Listing';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function inspectListings() {
  console.log('🔍 Verisite - Database Listing Inspector');
  console.log('==========================================\n');

  try {
    await connectToDatabase();

    const listings = await Listing.find({}).populate('userId', 'name');
    
    if (listings.length === 0) {
      console.log('∅ No listings found in the database.');
    } else {
      console.log(`Found ${listings.length} listing(s):\n`);
      listings.forEach((l, i) => {
        console.log(`[${i + 1}] ID: ${l._id}`);
        console.log(`    Price: ₹${l.price}`);
        console.log(`    User: ${(l.userId as any)?.name || 'N/A'}`);
        console.log(`    Details: ${l.roomDetails.slice(0, 50)}...`);
        console.log(`    Status: ${l.status}`);
        console.log('    -----------------------------------');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Inspection failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

inspectListings();
