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
    await connectToDatabase();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.verified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    const emailToVerify = user.role === 'STUDENT' ? user.collegeEmail : user.email;

    const emailSent = await sendEmail({
      to: emailToVerify!,
      subject: 'Verify your Verisite account',
      html: generateVerificationEmailHtml(verifyUrl, user.name),
    });

    if (!emailSent) {
      return NextResponse.json({ 
        error: 'Failed to send email. Please check console if in development.',
        debugLink: process.env.NODE_ENV === 'development' ? verifyUrl : undefined
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
