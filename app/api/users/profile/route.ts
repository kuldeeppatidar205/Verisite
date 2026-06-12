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
      
      // Generate new token
      const personalVerificationToken = crypto.randomBytes(32).toString('hex');
      user.personalVerificationToken = personalVerificationToken;
      user.personalVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      personalEmailChanged = true;
    }

    // Handle College Email Correction (Only if unverified)
    if (validated.collegeEmail && validated.collegeEmail.toLowerCase() !== (user.collegeEmail || '').toLowerCase()) {
      if (user.collegeEmailVerified) {
        return NextResponse.json({ error: 'Verified college email cannot be changed' }, { status: 403 });
      }

      // Check if new college email is already taken
      const existingUser = await User.findOne({ collegeEmail: validated.collegeEmail.toLowerCase() });
      if (existingUser) {
        return NextResponse.json({ error: 'College email already in use' }, { status: 400 });
      }

      user.collegeEmail = validated.collegeEmail.toLowerCase();

      // Generate new token
      const collegeVerificationToken = crypto.randomBytes(32).toString('hex');
      user.collegeVerificationToken = collegeVerificationToken;
      user.collegeVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
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

    // Trigger verification emails if changed
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    
    if (personalEmailChanged) {
      const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${user.personalVerificationToken}&type=personal`;
      await sendEmail({
        to: user.email,
        subject: 'Verify your Verisite account',
        html: generateVerificationEmailHtml(verifyUrl, user.name),
      });
    }

    if (collegeEmailChanged) {
      const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${user.collegeVerificationToken}&type=college`;
      await sendEmail({
        to: user.collegeEmail,
        subject: 'Verify your Verisite Student account',
        html: generateVerificationEmailHtml(verifyUrl, user.name),
      });
    }

    return NextResponse.json({
      message: (personalEmailChanged || collegeEmailChanged) 
        ? 'Profile updated. A new verification email has been sent to your updated address.'
        : 'Profile updated successfully',
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
  } catch (error) {
    console.error('Profile update error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
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
