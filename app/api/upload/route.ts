import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    // Dynamically configure inside the route to ensure it catches NextJS environment variables at runtime
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Authentication required: Token missing from headers.' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (tokenError: any) {
      console.error("JWT Verification failed during upload:", tokenError.message);
      return NextResponse.json({ error: `Authentication failed: ${tokenError.message}` }, { status: 401 });
    }
    await connectToDatabase();

    const user = await User.findById(payload.userId);
    if (!user || !user.verified) {
      return NextResponse.json({ error: 'Only verified users can upload images.' }, { status: 403 });
    }

    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided.' }, { status: 400 });
    }

    if (files.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 images allowed.' }, { status: 400 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
       return NextResponse.json({ error: 'Cloudinary credentials missing on server configuration.' }, { status: 500 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `File ${file.name} is not a supported image type. Use JPG, PNG or WebP.` }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Compress and resize the image using Sharp
      let processedBuffer: Buffer = buffer as unknown as Buffer;
      try {
        const outputBuffer = await sharp(buffer)
          .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
          .jpeg({ quality: 80 }) // Compress to 80% quality JPEG
          .toBuffer();
        processedBuffer = outputBuffer as unknown as Buffer;
      } catch (sharpError: any) {
        console.warn('Sharp compression skipped due to error, proceeding with original buffer:', sharpError);
      }

      // Upload to Cloudinary using a Promise wrapper around upload_stream
      try {
        const secureUrl = await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'verisite_listings', format: 'jpg' },
            (error, result) => {
              if (error) {
                console.error("Cloudinary stream error:", error);
                reject(error);
              } else if (result) {
                resolve(result.secure_url);
              } else {
                reject(new Error('Unknown upload error occurred.'));
              }
            }
          );
          uploadStream.end(processedBuffer);
        });
        uploadedUrls.push(secureUrl);
      } catch (uploadError: any) {
        return NextResponse.json({ error: `Cloudinary rejected upload: ${uploadError.message || 'Unknown error'}` }, { status: 500 });
      }
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 });

  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected server error occurred during upload' }, { status: 500 });
  }
}
