import mongoose, { Schema, Document } from 'mongoose';

interface LegacyBundle {
  mattress?: boolean;
  cooler?: boolean;
  shelf?: boolean;
  lamp?: boolean;
  other?: string;
}

export interface IListing extends Document {
  userId: mongoose.Types.ObjectId;
  listingType: 'handover' | 'pg' | 'roommate';
  pgName?: string;
  roomDetails?: string;
  price?: number;
  availableDate: Date;
  legacyBundle?: LegacyBundle;
  address?: string;
  amenities?: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  totalRooms?: number;
  availableRooms?: number;
  status: 'available' | 'pending' | 'taken';
  isOwnerListing: boolean;
  handoverMode: boolean;
  reviewCount: number;
  sharingType?: 'single' | 'double' | 'triple' | 'multiple' | '';
  foodIncluded?: boolean;
  billsIncluded?: boolean;
  genderCategory?: 'boys' | 'girls' | 'both' | '';
  images?: string[];
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listingType: { type: String, enum: ['handover', 'pg', 'roommate'], default: 'handover', required: true },
    pgName: { type: String },
    roomDetails: { type: String },
    price: { type: Number },
    availableDate: { type: Date, required: true },
    legacyBundle: {
      type: {
        mattress: Boolean,
        cooler: Boolean,
        shelf: Boolean,
        lamp: Boolean,
        other: String,
      },
      default: {},
    },
    address: { type: String },
    amenities: [{ type: String }],
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    totalRooms: { type: Number },
    availableRooms: { type: Number },
    status: {
      type: String,
      enum: ['available', 'pending', 'taken'],
      default: 'available',
    },
    isOwnerListing: { type: Boolean, default: false },
    handoverMode: { type: Boolean, default: false },
    reviewCount: { type: Number, default: 0 },
    sharingType: { type: String, enum: ['single', 'double', 'triple', 'multiple', ''] },
    foodIncluded: { type: Boolean, default: false },
    billsIncluded: { type: Boolean, default: false },
    genderCategory: { type: String, enum: ['boys', 'girls', 'both', ''], default: '' },
    images: { type: [String], default: [] },
    aiSummary: { type: String },
  },
  { timestamps: true }
);

listingSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
listingSchema.index({ address: 'text' });
listingSchema.index({ userId: 1 });
listingSchema.index({ isOwnerListing: 1 });
listingSchema.index({ listingType: 1 });

// Fix Next.js HMR caching issues with Mongoose
if (mongoose.models.Listing) {
  delete mongoose.models.Listing;
}

export const Listing = mongoose.model<IListing>('Listing', listingSchema);
