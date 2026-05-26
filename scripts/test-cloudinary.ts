import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  try {
    const result = await cloudinary.api.ping();
    if (result && result.status === 'ok') {
      console.log('✅ SUCCESS: Cloudinary is connected and working correctly!');
    } else {
      console.log('⚠️ WARNING: Ping returned an unexpected response:', result);
    }
  } catch (error: any) {
    console.error('❌ ERROR: Cloudinary test failed!');
    console.error('Details:', error.message || error);
  }
}

testCloudinary();
