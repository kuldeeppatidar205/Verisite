import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/db';
import { Review } from '../lib/models/Review';
import { Listing } from '../lib/models/Listing';
import { User } from '../lib/models/User';
import { generateReviewSummary } from '../lib/utils/ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function populateReviews() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    const reviews = await Review.find();
    console.log(`Found ${reviews.length} existing reviews to update.`);

    for (const review of reviews) {
      review.wifiRating = Math.floor(Math.random() * 3) + 3; // 3-5
      review.foodRating = Math.floor(Math.random() * 3) + 3;
      review.securityRating = Math.floor(Math.random() * 3) + 3;
      review.behaviorRating = Math.floor(Math.random() * 3) + 3;
      review.backupRating = Math.floor(Math.random() * 3) + 3;
      review.responsivenessRating = Math.floor(Math.random() * 3) + 3;
      
      const summary = await generateReviewSummary([{
        rating: review.rating,
        wifiRating: review.wifiRating,
        foodRating: review.foodRating,
        securityRating: review.securityRating,
        behaviorRating: review.behaviorRating,
        backupRating: review.backupRating,
        responsivenessRating: review.responsivenessRating,
        comment: review.comment,
      }]);
      
      review.aiSummary = summary || undefined;
      await review.save();
      console.log(`Updated review ${review._id}`);
    }

    // Add some new ones if we have listings and students
    const student = await User.findOne({ role: 'STUDENT', personalEmailVerified: true, collegeEmailVerified: true });
    const listings = await Listing.find().limit(3);

    if (student && listings.length > 0) {
      console.log('Adding new high-quality reviews...');
      const comments = [
        "The warden is super helpful, but the Wi-Fi can be a bit slow during peak hours. Overall a decent stay for the price.",
        "Best food in this area, they actually have a varied menu. Security is tight which is great for parents' peace of mind.",
        "Everything is perfect except for the water backup. Had a few issues last week, but the management fixed it eventually."
      ];

      for (let i = 0; i < listings.length; i++) {
        // Check if student already reviewed this listing
        const exists = await Review.findOne({ userId: student._id, listingId: listings[i]._id });
        if (exists) continue;

        const ratings = {
          rating: 4,
          wifiRating: 4,
          foodRating: 5,
          securityRating: 5,
          behaviorRating: 4,
          backupRating: 3,
          responsivenessRating: 4,
        };

        const comment = comments[i % comments.length];
        const summary = await generateReviewSummary([{
          ...ratings,
          comment
        }]);

        const newReview = new Review({
          userId: student._id,
          listingId: listings[i]._id,
          ...ratings,
          comment,
          aiSummary: summary || undefined,
          geofenceVerified: true,
        });

        await newReview.save();
        
        // Also update listing with combined summary (backfill style)
        const allReviews = await Review.find({ listingId: listings[i]._id });
        const listingAiSummary = await generateReviewSummary(allReviews);
        
        await Listing.findByIdAndUpdate(listings[i]._id, { 
          $inc: { reviewCount: 1 },
          aiSummary: listingAiSummary || undefined
        });
        console.log(`Added new review for ${listings[i].pgName}`);
      }
    }

    console.log('Population complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating reviews:', error);
    process.exit(1);
  }
}

populateReviews();
