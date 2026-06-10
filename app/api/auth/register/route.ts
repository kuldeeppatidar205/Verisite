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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userObj: any = {
      name: validated.name,
      email: validated.email,
      passwordHash: hashedPassword,
      role: validated.role,
      phoneNumber: validated.phoneNumber,
      verified: false, // All users must verify their personal email
      verificationToken,
      verificationTokenExpiry,
    };

    const newUser = new User(userObj);
    await newUser.save();
    console.log('👤 User created successfully:', newUser._id);

    let emailSent = false;
    let verifyUrl = '';

    // Send verification email for all users
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    console.log('🌐 Using Base URL for verification:', baseUrl);
    
    // Send verification email
    verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    console.log(`📧 Attempting to send verification email to: ${validated.email}`);
    
    emailSent = await sendEmail({
      to: validated.email,
      subject: 'Verify your Verisite account',
      html: generateVerificationEmailHtml(verifyUrl, validated.name),
    });

    if (!emailSent) {
      console.warn('❌ Email sending failed (sendEmail returned false) for user:', newUser._id);
    } else {
      console.log('✅ Verification email sent successfully to:', validated.email);
    }

    // Generate JWT token
    const jwtToken = signToken({ 
      userId: newUser._id.toString(), 
      email: newUser.email,
      role: newUser.role
    });

    return NextResponse.json(
      {
        message: emailSent 
            ? 'Registration successful. Please verify your personal email.' 
            : 'Registration successful. Check console for verification link (email not sent - check Gmail credentials).',
        token: jwtToken,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          collegeEmail: newUser.collegeEmail,
          verified: newUser.verified,
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

    return NextResponse.json({ error: 'Registration failed: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
