import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { loginSchema } from '@/lib/validators';
import { signToken } from '@/lib/auth';
import { User } from '@/lib/models/User';

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
      console.warn(`⚠️ Login attempt with non-existent email: ${emailLower}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      console.warn(`⚠️ Login attempt with wrong password for: ${emailLower}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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
        hostelName: user.hostelName,
        roomNumber: user.roomNumber,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
