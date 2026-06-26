import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models/User';
import { signToken } from '@/lib/auth';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, type } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    await connectToDatabase();
    const emailLower = email.toLowerCase();
    
    // Find user by email or college email
    const dbUser = await User.findOne({
      $or: [
        { email: emailLower },
        { collegeEmail: emailLower }
      ]
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    // Determine type dynamically if not provided or mismatch
    let matchedType = type;
    if (!matchedType) {
      if (dbUser.collegeEmail === emailLower) {
        matchedType = 'college';
      } else {
        matchedType = 'personal';
      }
    }

    console.log('🔍 OTP Verification Attempt:', {
      email: emailLower,
      type: matchedType,
      dbPersonalToken: dbUser.personalVerificationToken,
      dbPersonalExpiry: dbUser.personalVerificationTokenExpiry,
      dbCollegeToken: dbUser.collegeVerificationToken,
      dbCollegeExpiry: dbUser.collegeVerificationTokenExpiry,
      submittedOtp: otp,
      currentTime: new Date()
    });

    if (matchedType === 'college') {
      if (dbUser.collegeEmailVerified) {
        return NextResponse.json({ error: 'College email is already verified' }, { status: 400 });
      }
      if (!dbUser.collegeVerificationToken || dbUser.collegeVerificationToken !== otp) {
        return NextResponse.json({ error: 'Invalid verification OTP' }, { status: 400 });
      }
      if (dbUser.collegeVerificationTokenExpiry && dbUser.collegeVerificationTokenExpiry < new Date()) {
        return NextResponse.json({ error: 'Verification OTP has expired' }, { status: 400 });
      }
      
      dbUser.collegeEmailVerified = true;
      dbUser.collegeVerificationToken = undefined;
      dbUser.collegeVerificationTokenExpiry = undefined;
    } else {
      if (dbUser.personalEmailVerified) {
        return NextResponse.json({ error: 'Personal email is already verified' }, { status: 400 });
      }
      if (!dbUser.personalVerificationToken || dbUser.personalVerificationToken !== otp) {
        return NextResponse.json({ error: 'Invalid verification OTP' }, { status: 400 });
      }
      if (dbUser.personalVerificationTokenExpiry && dbUser.personalVerificationTokenExpiry < new Date()) {
        return NextResponse.json({ error: 'Verification OTP has expired' }, { status: 400 });
      }

      dbUser.personalEmailVerified = true;
      dbUser.personalVerificationToken = undefined;
      dbUser.personalVerificationTokenExpiry = undefined;
    }

    await dbUser.save();

    // Generate new JWT token with updated claims
    const token = signToken({ 
      userId: dbUser._id.toString(), 
      email: dbUser.email,
      role: dbUser.role,
      personalEmailVerified: dbUser.personalEmailVerified,
      collegeEmailVerified: dbUser.collegeEmailVerified,
    });

    return NextResponse.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        collegeEmail: dbUser.collegeEmail,
        personalEmailVerified: dbUser.personalEmailVerified,
        collegeEmailVerified: dbUser.collegeEmailVerified,
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
