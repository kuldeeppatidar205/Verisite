import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type'); // 'personal' or 'college'

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    await connectToDatabase();

    let user;
    if (type === 'college') {
      user = await User.findOne({
        collegeVerificationToken: token,
        collegeVerificationTokenExpiry: { $gt: new Date() },
      });
      if (user) {
        user.collegeEmailVerified = true;
        user.collegeVerificationToken = undefined;
        user.collegeVerificationTokenExpiry = undefined;
      }
    } else {
      // Default to personal if type is missing or 'personal'
      user = await User.findOne({
        personalVerificationToken: token,
        personalVerificationTokenExpiry: { $gt: new Date() },
      });
      if (user) {
        user.personalEmailVerified = true;
        user.personalVerificationToken = undefined;
        user.personalVerificationTokenExpiry = undefined;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    await user.save();

    // Redirect to login page
    const redirectUrl = type === 'college' 
      ? '/profile?collegeVerified=true' 
      : '/login?verified=true';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Email verification failed' }, { status: 500 });
  }
}
