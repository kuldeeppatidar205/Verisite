import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { Report } from '@/lib/models/Report';
import { Review } from '@/lib/models/Review';
import { reportReviewSchema } from '@/lib/validators';
import { ZodError } from 'zod';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const body = await req.json();
    const validated = reportReviewSchema.parse(body);

    const { id: reviewId } = await params;

    await connectToDatabase();

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user already reported this review
    const existingReport = await Report.findOne({
      reporterId: payload.userId,
      reviewId: reviewId,
    });

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this review' }, { status: 400 });
    }

    const newReport = new Report({
      reporterId: payload.userId,
      reviewId: reviewId,
      reason: validated.reason,
    });

    await newReport.save();

    return NextResponse.json({ message: 'Review reported successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Report review error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to report review' }, { status: 500 });
  }
}
