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

      const collegeVerificationToken = crypto.randomBytes(32).toString('hex');
      user.collegeVerificationToken = collegeVerificationToken;
      user.collegeVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
      const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${collegeVerificationToken}&type=college`;

      const emailSent = await sendEmail({
        to: user.collegeEmail,
        subject: 'Verify your Verisite Student account',
        html: generateVerificationEmailHtml(verifyUrl, user.name),
      });

      if (!emailSent) {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    } else {
      if (user.personalEmailVerified) {
        return NextResponse.json({ error: 'Personal email already verified' }, { status: 400 });
      }

      const personalVerificationToken = crypto.randomBytes(32).toString('hex');
      user.personalVerificationToken = personalVerificationToken;
      user.personalVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
      const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${personalVerificationToken}&type=personal`;

      const emailSent = await sendEmail({
        to: user.email,
        subject: 'Verify your Verisite account',
        html: generateVerificationEmailHtml(verifyUrl, user.name),
      });

      if (!emailSent) {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
