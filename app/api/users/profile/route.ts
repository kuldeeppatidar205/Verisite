import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Listing } from '@/lib/models/Listing';
import { profileUpdateSchema } from '@/lib/validators';
import { sendEmail, generateVerificationEmailHtml } from '@/lib/email';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);

    await connectToDatabase();

    const user = await User.findById(payload.userId).select('-passwordHash -personalVerificationToken -collegeVerificationToken');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      collegeEmail: user.collegeEmail,
      personalEmailVerified: user.personalEmailVerified,
      collegeEmailVerified: user.collegeEmailVerified,
      hostelName: user.hostelName,
      roomNumber: user.roomNumber,
      idCardImageUrl: user.idCardImageUrl,
      favoriteCollege: user.favoriteCollege,
      createdAt: user.createdAt,
      });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const body = await req.json();
    const validated = profileUpdateSchema.parse(body);

    await connectToDatabase();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let personalEmailChanged = false;
    let collegeEmailChanged = false;

    // Handle Personal Email Correction (Only if unverified)
    if (validated.email && validated.email.toLowerCase() !== user.email.toLowerCase()) {
      if (user.personalEmailVerified) {
        return NextResponse.json({ error: 'Verified personal email cannot be changed' }, { status: 403 });
      }
      
      // Check if new email is already taken
      const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }

      user.email = validated.email.toLowerCase();
      
      // Generate new OTP
      const personalVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      user.personalVerificationToken = personalVerificationToken;
      user.personalVerificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      personalEmailChanged = true;
    }

    // Handle College Email Update
    if (validated.collegeEmail && validated.collegeEmail.toLowerCase() !== (user.collegeEmail || '').toLowerCase()) {
      // Check if new college email is already taken
      const existingUser = await User.findOne({ collegeEmail: validated.collegeEmail.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'College email already in use' }, { status: 400 });
      }

      user.collegeEmail = validated.collegeEmail.toLowerCase();
      user.collegeEmailVerified = false; // Reset verification status!

      // Generate new OTP
      const collegeVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      user.collegeVerificationToken = collegeVerificationToken;
      user.collegeVerificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      collegeEmailChanged = true;
    }

    // Update other allowed fields
    if (validated.name) user.name = validated.name;
    
    // Only Owners can have/update phone numbers
    if (user.role === 'OWNER' && validated.phoneNumber) {
      user.phoneNumber = validated.phoneNumber;
    }

    // Support favoriteCollege updates
    if (validated.favoriteCollege) {
      user.favoriteCollege = validated.favoriteCollege;
    }

    // Update Hostel/Room fields
    if (validated.hostelName) user.hostelName = validated.hostelName;
    if (validated.roomNumber) user.roomNumber = validated.roomNumber;

    await user.save();

    // Trigger verification OTPs if changed
    let personalEmailSent = true;
    let collegeEmailSent = true;

    if (personalEmailChanged) {
      personalEmailSent = await sendEmail({
        to: user.email,
        subject: 'Verify your Verisite account',
        html: generateVerificationEmailHtml(user.personalVerificationToken, user.name),
      });
    }

    if (collegeEmailChanged) {
      collegeEmailSent = await sendEmail({
        to: user.collegeEmail,
        subject: 'Verify your Verisite Student account',
        html: generateVerificationEmailHtml(user.collegeVerificationToken, user.name),
      });
    }

    let responseMessage = 'Profile updated successfully';
    if (personalEmailChanged || collegeEmailChanged) {
      if (!personalEmailSent || !collegeEmailSent) {
        responseMessage = 'Profile updated, but we encountered an error sending the verification OTP. Please verify the email is correct and try clicking "Resend OTP".';
      } else {
        responseMessage = 'Profile updated. A new verification OTP has been sent to your updated address.';
      }
    }

    return NextResponse.json({
      message: responseMessage,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        collegeEmail: user.collegeEmail,
        personalEmailVerified: user.personalEmailVerified,
        collegeEmailVerified: user.collegeEmailVerified,
        hostelName: user.hostelName,
        roomNumber: user.roomNumber,
        favoriteCollege: user.favoriteCollege,
      }
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    if (error.message && (error.message.includes('timed out') || error.message.includes('timeout') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json({ error: 'Service temporarily unavailable due to database connection timeout. Please try again in a few moments.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to update profile: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);

    await connectToDatabase();

    // Delete all listings by this user
    await Listing.deleteMany({ userId: payload.userId });

    // Delete the user
    const result = await User.deleteOne({ _id: payload.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Account and all listings deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
