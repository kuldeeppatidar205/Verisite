import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'OWNER' | 'GUEST' | 'ADMIN';
  collegeEmail?: string;
  phoneNumber?: string;
  favoriteCollege?: {
    name: string;
    lat: number;
    lng: number;
  };
  personalEmailVerified: boolean;
  collegeEmailVerified: boolean;
  personalVerificationToken?: string;
  collegeVerificationToken?: string;
  personalVerificationTokenExpiry?: Date;
  collegeVerificationTokenExpiry?: Date;
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
    role: { type: String, enum: ['STUDENT', 'OWNER', 'GUEST', 'ADMIN'], default: 'STUDENT' },
    collegeEmail: { type: String, unique: true, sparse: true, lowercase: true },
    phoneNumber: { type: String },
    favoriteCollege: {
      name: String,
      lat: Number,
      lng: Number,
    },
    personalEmailVerified: { type: Boolean, default: false },
    collegeEmailVerified: { type: Boolean, default: false },
    personalVerificationToken: { type: String },
    personalVerificationTokenExpiry: { type: Date },
    collegeVerificationToken: { type: String },
    collegeVerificationTokenExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
