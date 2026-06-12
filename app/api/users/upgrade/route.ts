import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { upgradeToStudentSchema } from '@/lib/validators';
import { sendEmail, generateVerificationEmailHtml } from '@/lib/email';
import crypto from 'crypto';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const body = await req.json();
    const validated = upgradeToStudentSchema.parse(body);

    await connectToDatabase();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'GUEST') {
      return NextResponse.json({ error: 'This account is already verified or is not eligible for student verification' }, { status: 400 });
    }

    // Check if college email is already in use
    const emailConflict = await User.findOne({
      $or: [{ email: validated.collegeEmail }, { collegeEmail: validated.collegeEmail }],
    });
    if (emailConflict) {
      return NextResponse.json({ error: 'This institutional email is already in use' }, { status: 400 });
    }

    // Generate verification token
    const collegeVerificationToken = crypto.randomBytes(32).toString('hex');
    const collegeVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user to student role and set to unverified
    user.role = 'STUDENT';
    user.collegeEmail = validated.collegeEmail;
    user.collegeEmailVerified = false;
    user.collegeVerificationToken = collegeVerificationToken;
    user.collegeVerificationTokenExpiry = collegeVerificationTokenExpiry;
    
    if (validated.favoriteCollege) {
      user.favoriteCollege = validated.favoriteCollege;
    }

    await user.save();

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${collegeVerificationToken}&type=college`;
    
    await sendEmail({
      to: validated.collegeEmail,
      subject: 'Verify your Verisite Student account',
      html: generateVerificationEmailHtml(verifyUrl, user.name),
    });

    return NextResponse.json({
      message: 'Upgrade initiated. Please verify your institutional email.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        collegeEmail: user.collegeEmail,
        personalEmailVerified: user.personalEmailVerified,
        collegeEmailVerified: user.collegeEmailVerified,
      }
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to upgrade account' }, { status: 500 });
  }
}
