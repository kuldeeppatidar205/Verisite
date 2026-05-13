import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import { University } from '../lib/models/University';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function seedUniversities() {
  console.log('🌱 Seeding PurePG universities...\n');

  try {
    await connectToDatabase();

    const universities = [
      {
        name: 'Indian Institute of Technology Kanpur',
        emailDomains: ['iitk.ac.in', 'cse.iitk.ac.in', 'student.iitk.ac.in'],
      },
      {
        name: 'Delhi University',
        emailDomains: ['du.ac.in', 'student.du.ac.in'],
      },
      {
        name: 'Mumbai University',
        emailDomains: ['mu.ac.in', 'student.mu.ac.in'],
      },
      {
        name: 'Bangalore University',
        emailDomains: ['bub.ac.in', 'student.bub.ac.in'],
      },
      {
        name: 'JECRC University',
        emailDomains: ['jecrcu.edu.in'],
      },
      {
        name: 'Poornima University',
        emailDomains: ['poornima.edu.in'],
      },
    ];

    for (const univData of universities) {
      const existing = await University.findOne({ name: univData.name });
      if (!existing) {
        const university = new University(univData);
        await university.save();
        console.log(`✓ Added: ${univData.name}`);
      } else {
        console.log(`✓ Already exists: ${univData.name}`);
      }
    }

    console.log('\n✓ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

seedUniversities();
