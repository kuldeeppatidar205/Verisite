import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import mongoose from 'mongoose';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function fixIndexes() {
  console.log('🛠️  Fixing User Indexes and Cleaning Data...\n');

  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // 1. Check for empty strings in collegeEmail
    const emptyEmails = await collection.find({ collegeEmail: "" }).toArray();
    console.log(`Found ${emptyEmails.length} users with empty string as collegeEmail.`);

    if (emptyEmails.length > 0) {
      console.log('Cleaning up empty strings (converting to undefined/removing field)...');
      await collection.updateMany({ collegeEmail: "" }, { $unset: { collegeEmail: "" } });
      console.log('✓ Cleanup complete.');
    }

    // 2. Drop and Recreate the index to ensure it is sparse
    console.log('\nRefreshing unique index on collegeEmail...');
    try {
      await collection.dropIndex('collegeEmail_1');
      console.log('✓ Dropped existing index.');
    } catch (e) {
      console.log('ℹ No existing collegeEmail index found or could not drop.');
    }

    console.log('Creating new sparse unique index...');
    await collection.createIndex({ collegeEmail: 1 }, { unique: true, sparse: true });
    console.log('✓ Sparse unique index created.');

    console.log('\n✓ Database fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Fix failed:', error);
    process.exit(1);
  }
}

fixIndexes();
