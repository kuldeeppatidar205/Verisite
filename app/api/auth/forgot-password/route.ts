import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validators';
import { User } from '@/lib/models/User';
import { sendEmail, generateResetPasswordEmailHtml } from '@/lib/email';
import crypto from 'crypto';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.parse(body);

    await connectToDatabase();

    // Find user by primary email or college email
    const user = await User.findOne({
      $or: [{ email: validated.email }, { collegeEmail: validated.email }],
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ message: 'If an account exists with this email, you will receive a reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: validated.email,
      subject: 'Reset your Verisite password',
      html: generateResetPasswordEmailHtml(resetUrl, user.name),
    });

    return NextResponse.json({ message: 'If an account exists with this email, you will receive a reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
