import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function inspectUsers() {
  console.log('🔍 Inspecting Users...\n');

  try {
    await connectToDatabase();

    const users = await User.find({}).select('email collegeEmail role name');
    
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, i) => {
      console.log(`[${i + 1}] ${user.name} (${user.role})`);
      console.log(`    Personal Email: ${user.email}`);
      console.log(`    College Email:  ${user.collegeEmail === undefined ? 'UNDEFINED' : user.collegeEmail === '' ? 'EMPTY STRING' : user.collegeEmail}`);
      console.log('-------------------');
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Inspection failed:', error);
    process.exit(1);
  }
}

inspectUsers();
