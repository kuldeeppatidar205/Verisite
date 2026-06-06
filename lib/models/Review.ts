import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  rating: number;
  wifiRating?: number;
  foodRating?: number;
  securityRating?: number;
  behaviorRating?: number;
  backupRating?: number;
  responsivenessRating?: number;
  comment: string;
  aiSummary?: string;
  geofenceVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    wifiRating: { type: Number, min: 1, max: 5 },
    foodRating: { type: Number, min: 1, max: 5 },
    securityRating: { type: Number, min: 1, max: 5 },
    behaviorRating: { type: Number, min: 1, max: 5 },
    backupRating: { type: Number, min: 1, max: 5 },
    responsivenessRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, required: true },
    aiSummary: { type: String },
    geofenceVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ listingId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ userId: 1, listingId: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
