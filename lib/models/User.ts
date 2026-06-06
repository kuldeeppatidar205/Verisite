import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'OWNER' | 'GUEST';
  collegeEmail?: string;
  phoneNumber?: string;
  favoriteCollege?: {
    name: string;
    lat: number;
    lng: number;
  };
  verified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['STUDENT', 'OWNER', 'GUEST'], default: 'STUDENT' },
    collegeEmail: { type: String, unique: true, sparse: true, lowercase: true },
    phoneNumber: { type: String },
    favoriteCollege: {
      name: String,
      lat: Number,
      lng: Number,
    },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
