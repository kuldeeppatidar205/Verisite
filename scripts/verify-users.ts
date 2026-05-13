import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verifyAllUsers() {
  console.log('🛡️  PurePG - Manual User Verification');
  console.log('========================================\n');

  try {
    await connectToDatabase();

    const result = await User.updateMany(
      { verified: false },
      { $set: { verified: true, verificationToken: undefined, verificationTokenExpiry: undefined } }
    );

    console.log(`✓ Successfully verified ${result.modifiedCount} user(s).`);
    console.log('\n✓ You can now create listings with your account!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Verification failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

verifyAllUsers();
