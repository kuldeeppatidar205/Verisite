import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../lib/db';
import { User } from '../lib/models/User';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedAdmin() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    const adminEmail = 'admin@verisitee.com';
    const adminPassword = 'kuldeep2052007';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin.passwordHash = hashedPassword;
      existingAdmin.role = 'ADMIN';
      existingAdmin.verified = true;
      await existingAdmin.save();
      console.log('Admin password updated successfully');
    } else {
      console.log('Creating new admin...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = new User({
        name: 'Super Admin',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        verified: true,
      });
      await newAdmin.save();
      console.log('Admin created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
