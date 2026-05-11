import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import mongoose from 'mongoose';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkNulls() {
  console.log('🔍 Checking for nulls in collegeEmail...\n');

  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    const nullEmails = await collection.find({ collegeEmail: null }).toArray();
    console.log(`Found ${nullEmails.length} users with null as collegeEmail.`);

    if (nullEmails.length > 0) {
      console.log('Cleaning up null values (removing field)...');
      await collection.updateMany({ collegeEmail: null }, { $unset: { collegeEmail: "" } });
      console.log('✓ Cleanup complete.');
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Check failed:', error);
    process.exit(1);
  }
}

checkNulls();
