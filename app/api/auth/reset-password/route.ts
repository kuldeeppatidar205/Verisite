import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validators';
import { User } from '@/lib/models/User';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.parse(body);

    await connectToDatabase();

    // Find user by reset token and ensure it's not expired
    const user = await User.findOne({
      resetPasswordToken: validated.token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Update password and clear reset token fields
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return NextResponse.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
