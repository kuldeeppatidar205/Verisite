import mongoose, { Connection } from 'mongoose';

let cachedConnection: Connection | null = null;

export async function connectToDatabase(): Promise<Connection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = connection.connection;
    console.log('✓ MongoDB connected successfully');
    return cachedConnection;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    console.log('✓ MongoDB disconnected');
  }
}
