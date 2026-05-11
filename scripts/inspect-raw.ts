import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/db';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function inspectRaw() {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB not connected');

    const listings = await db.collection('listings').find({}).toArray();
    
    console.log(`Found ${listings.length} raw listings:`);
    console.log(JSON.stringify(listings, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectRaw();
