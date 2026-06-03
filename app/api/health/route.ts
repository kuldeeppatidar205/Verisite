import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  const healthData: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      mongodb_uri: !!process.env.MONGODB_URI,
      jwt_secret: !!process.env.JWT_SECRET,
      gmail_user: !!process.env.GMAIL_USER,
    }
  };

  try {
    await connectToDatabase();
    healthData.database = {
      status: 'connected',
      state: mongoose.connection.readyState,
    };
  } catch (err: any) {
    healthData.status = 'error';
    healthData.database = {
      status: 'error',
      message: err.message || 'Connection failed',
    };
  }

  return NextResponse.json(healthData, { status: healthData.status === 'ok' ? 200 : 500 });
}
