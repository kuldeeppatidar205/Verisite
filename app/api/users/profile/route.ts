import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { Listing } from '@/lib/models/Listing';
import { profileUpdateSchema } from '@/lib/validators';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);

    await connectToDatabase();

    const user = await User.findById(payload.userId).select('-passwordHash -verificationToken');
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
      verified: user.verified,
      hostelName: user.hostelName,
      roomNumber: user.roomNumber,
      studentId: user.studentId,
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

    // Update allowed fields
    if (validated.name) user.name = validated.name;
    if (validated.phoneNumber) user.phoneNumber = validated.phoneNumber;
    
    // Only students have hostel/room details
    if (user.role === 'STUDENT') {
      if (validated.hostelName !== undefined) user.hostelName = validated.hostelName;
      if (validated.roomNumber !== undefined) user.roomNumber = validated.roomNumber;
    }

    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        collegeEmail: user.collegeEmail,
        verified: user.verified,
        hostelName: user.hostelName,
        roomNumber: user.roomNumber,
        studentId: user.studentId,
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
