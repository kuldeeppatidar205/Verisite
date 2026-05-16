import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/db';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkDatabaseConnection() {
  console.log('🔍 Verisite - MongoDB Connection Check');
  console.log('==========================================\n');

  try {
    console.log('📡 Connecting to MongoDB...');
    await connectToDatabase();

    console.log('✓ Connection successful!\n');

    // Try a test write/read
    console.log('📝 Testing database operations...');
    const testCollection = mongoose.connection.collection('_connection_test');
    const testData = { timestamp: new Date(), message: 'Verisite test' };
    
    const writeResult = await testCollection.insertOne(testData);
    console.log('✓ Write successful (document ID:', writeResult.insertedId.toString().slice(0, 8) + '...)\n');

    const readResult = await testCollection.findOne({ _id: writeResult.insertedId });
    if (readResult) {
      console.log('✓ Read successful\n');
    }

    // Cleanup
    await testCollection.deleteOne({ _id: writeResult.insertedId });

    console.log('✓ Database test completed successfully!');
    console.log('✓ Your IP appears to be whitelisted on MongoDB Atlas\n');

    // Log connection stats
    const stats = (mongoose.connection.getClient() as any).topology;
    console.log('📊 Connection Stats:');
    console.log('   - Topology:', stats?.description?.type || 'N/A');
    console.log('   - Servers connected:', stats?.description?.servers?.length || 0);

  } catch (error) {
    console.error('✗ Connection failed!');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check MONGODB_URI in .env.local');
    console.error('   2. Ensure your IP is whitelisted on MongoDB Atlas');
    console.error('   3. Verify database user credentials');
    process.exit(1);
  }
}

// Run the check
checkDatabaseConnection().then(() => process.exit(0));
