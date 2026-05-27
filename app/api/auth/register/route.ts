import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { registerSchema } from '@/lib/validators';
import { signToken } from '@/lib/auth';
import { sendEmail, generateVerificationEmailHtml } from '@/lib/email';
import { User } from '@/lib/models/User';
import crypto from 'crypto';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    await connectToDatabase();

    // GLOBAL UNIQUENESS CHECK
    // Ensure the primary email isn't already used as an email OR a collegeEmail
    const emailConflict = await User.findOne({
      $or: [{ email: validated.email }, { collegeEmail: validated.email }],
    });
    if (emailConflict) {
      return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
    }

    let collegeEmail = undefined;
    let studentId = undefined;

    if (validated.role === 'STUDENT' && validated.collegeEmail) {
      // Ensure the college email isn't already used as an email OR a collegeEmail
      const collegeEmailConflict = await User.findOne({
        $or: [{ email: validated.collegeEmail }, { collegeEmail: validated.collegeEmail }],
      });
      if (collegeEmailConflict) {
        return NextResponse.json({ error: 'This college email is already in use' }, { status: 400 });
      }

      collegeEmail = validated.collegeEmail;
      studentId = validated.studentId;
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
      verified: validated.role === 'GUEST', // Guests are verified by default
      verificationToken,
      verificationTokenExpiry,
    };

    // Only add student-specific fields if they exist
    if (collegeEmail) userObj.collegeEmail = collegeEmail;
    if (studentId) userObj.studentId = studentId;
    if (validated.role === 'STUDENT') {
      if (validated.hostelName) userObj.hostelName = validated.hostelName;
      if (validated.roomNumber) userObj.roomNumber = validated.roomNumber;
    }

    // Geocode favoriteCollege if provided
    if (validated.collegeName && validated.role !== 'OWNER') {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/geocode/search?q=${encodeURIComponent(validated.collegeName)}`);
        const data = await res.json();
        if (res.ok && data.lat && data.lon) {
          userObj.favoriteCollege = {
            name: data.name || validated.collegeName,
            lat: data.lat,
            lng: data.lon,
          };
        }
      } catch (err) {
        console.error('Failed to geocode college during registration:', err);
      }
    }

    const newUser = new User(userObj);
    await newUser.save();

    let emailSent = false;
    let verifyUrl = '';

    // Only send verification email for non-GUEST users
    if (validated.role !== 'GUEST') {
      // Send verification email
      verifyUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;
      const emailToVerify = validated.role === 'STUDENT' ? validated.collegeEmail! : validated.email;
      
      emailSent = await sendEmail({
        to: emailToVerify,
        subject: 'Verify your Verisite account',
        html: generateVerificationEmailHtml(verifyUrl, validated.name),
      });

      if (!emailSent) {
        console.warn('⚠️ Email sending failed for user:', newUser._id);
        if (process.env.NODE_ENV === 'development') {
          console.warn('💡 Verification link for manual testing:', verifyUrl);
        }
      }
    }

    // Generate JWT token
    const jwtToken = signToken({ 
      userId: newUser._id.toString(), 
      email: newUser.email,
      role: newUser.role
    });

    return NextResponse.json(
      {
        message: validated.role === 'GUEST'
          ? 'Registration successful.'
          : (emailSent 
            ? 'Registration successful. Please verify your email.' 
            : 'Registration successful. Check console for verification link (email not sent - check Gmail credentials).'),
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
    console.error('CRITICAL: Registration error details:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email or College Email already registered' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Registration failed. Please try again later.' }, { status: 500 });
  }
}
