import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Report } from '@/lib/models/Report';
import { isAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const reports = await Report.find()
      .populate('reporterId', 'name email')
      .populate({
        path: 'reviewId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    await connectToDatabase();
    await Report.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Admin report delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
