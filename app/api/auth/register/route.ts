import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { registerSchema } from '@/lib/validators';
import { signToken } from '@/lib/auth';
import { sendEmail, generateVerificationEmailHtml } from '@/lib/email';
import { User } from '@/lib/models/User';
import crypto from 'crypto';
import { ZodError } from 'zod';
import { debugLog } from '@/lib/debug';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    debugLog('Registration attempt for: ' + body.email);
    const validated = registerSchema.parse(body);

    if (validated.role === 'STUDENT') {
      return NextResponse.json({ error: 'Please register as a Student and then verify your institutional identity in your profile.' }, { status: 400 });
    }

    await connectToDatabase();

    // GLOBAL UNIQUENESS CHECK
    // Ensure the primary email isn't already used as an email OR a collegeEmail
    const emailConflict = await User.findOne({
      $or: [{ email: validated.email }, { collegeEmail: validated.email }],
    });
    if (emailConflict) {
      return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Generate verification OTP
    const personalVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const personalVerificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user
    const userObj: any = {
      name: validated.name,
      email: validated.email,
      passwordHash: hashedPassword,
      role: validated.role,
      phoneNumber: validated.phoneNumber,
      personalEmailVerified: false, // All users must verify their personal email
      collegeEmailVerified: false,
      personalVerificationToken,
      personalVerificationTokenExpiry,
    };

    const newUser = new User(userObj);
    await newUser.save();
    console.log('👤 User created successfully:', newUser._id);

    let emailSent = false;

    console.log(`📧 Attempting to send verification email to: ${validated.email}`);
    
    emailSent = await sendEmail({
      to: validated.email,
      subject: 'Verify your Verisite account',
      html: generateVerificationEmailHtml(personalVerificationToken, validated.name),
    });

    if (!emailSent) {
      console.warn('❌ Email sending failed immediately for user:', newUser._id);
      // Rollback the user creation
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json({ 
        error: 'Failed to dispatch verification email. Please verify the email address is correct and try again.' 
      }, { status: 400 });
    }
    
    console.log('✅ Verification email sent successfully to:', validated.email);

    // Generate JWT token
    const jwtToken = signToken({ 
      userId: newUser._id.toString(), 
      email: newUser.email,
      role: newUser.role,
      personalEmailVerified: newUser.personalEmailVerified,
      collegeEmailVerified: newUser.collegeEmailVerified,
    });

    return NextResponse.json(
      {
        message: 'Registration successful. Please verify your personal email.',
        token: jwtToken,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          collegeEmail: newUser.collegeEmail,
          personalEmailVerified: newUser.personalEmailVerified,
          collegeEmailVerified: newUser.collegeEmailVerified,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    debugLog('CRITICAL: Registration error', error);
    console.error('CRITICAL: Registration error details:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email or College Email already registered' }, { status: 400 });
    }

    if (error.message && (error.message.includes('timed out') || error.message.includes('timeout') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json({ error: 'Service temporarily unavailable due to database connection timeout. Please try again in a few moments.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Registration failed: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
