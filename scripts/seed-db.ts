import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function seedDatabase() {
  console.log('🌱 Seeding Verisite database...\n');

  try {
    await connectToDatabase();
    
    // Future seeding logic can go here (e.g., initial categories, etc.)
    console.log('No data to seed currently.');

    console.log('\n✓ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

seedDatabase();
