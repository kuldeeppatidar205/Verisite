import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { loginSchema } from '@/lib/validators';
import { signToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    await connectToDatabase();

    // Convert email to lowercase for case-insensitive search
    const emailLower = validated.email.toLowerCase();

    // Find user by personal email OR college email
    const user = await User.findOne({
      $or: [
        { email: emailLower },
        { collegeEmail: emailLower },
      ],
    });

    if (!user) {
      console.warn('⚠️ Login attempt with non-existent email');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      console.warn('⚠️ Login attempt with wrong password');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if personal email is verified
    if (!user.verified && user.role !== 'STUDENT') {
      console.warn(`⚠️ Login attempt by unverified user: ${user.email}`);
      return NextResponse.json({ 
        error: 'Please verify your personal email before logging in. Check your inbox.' 
      }, { status: 403 });
    }

    // Generate JWT token
    const token = signToken({ 
      userId: user._id.toString(), 
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        collegeEmail: user.collegeEmail,
        verified: user.verified,
      },
    });
  } catch (error: any) {
    console.error('CRITICAL: Login error details:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Login failed: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
