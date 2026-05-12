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
  listingType: 'handover' | 'pg';
  roomDetails: string;
  price: number;
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
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listingType: { type: String, enum: ['handover', 'pg'], default: 'handover', required: true },
    roomDetails: { type: String, required: true },
    price: { type: Number, required: true },
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
  },
  { timestamps: true }
);

listingSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
listingSchema.index({ address: 'text' });
listingSchema.index({ userId: 1 });
listingSchema.index({ isOwnerListing: 1 });
listingSchema.index({ listingType: 1 });

export const Listing = mongoose.models.Listing || mongoose.model<IListing>('Listing', listingSchema);
