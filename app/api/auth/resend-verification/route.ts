import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { sendEmail, generateVerificationEmailHtml } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const body = await req.json().catch(() => ({}));
    const type = body.type || 'personal';

    await connectToDatabase();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (type === 'college') {
      if (user.collegeEmailVerified) {
        return NextResponse.json({ error: 'College email already verified' }, { status: 400 });
      }
      if (!user.collegeEmail) {
        return NextResponse.json({ error: 'No college email registered for this user' }, { status: 400 });
      }

      const collegeVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      user.collegeVerificationToken = collegeVerificationToken;
      user.collegeVerificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      const emailSent = await sendEmail({
        to: user.collegeEmail,
        subject: 'Verify your Verisite Student account',
        html: generateVerificationEmailHtml(collegeVerificationToken, user.name),
      });

      if (!emailSent) {
        return NextResponse.json({ error: 'Failed to send verification OTP. Please check your email address for typos and try again.' }, { status: 500 });
      }
    } else {
      if (user.personalEmailVerified) {
        return NextResponse.json({ error: 'Personal email already verified' }, { status: 400 });
      }

      const personalVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      user.personalVerificationToken = personalVerificationToken;
      user.personalVerificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      const emailSent = await sendEmail({
        to: user.email,
        subject: 'Verify your Verisite account',
        html: generateVerificationEmailHtml(personalVerificationToken, user.name),
      });

      if (!emailSent) {
        return NextResponse.json({ error: 'Failed to send verification OTP. Please check your email address for typos and try again.' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Verification OTP resent successfully' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    
    if (error.message && (error.message.includes('timed out') || error.message.includes('timeout') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json({ error: 'Service temporarily unavailable due to database connection timeout. Please try again in a few moments.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
