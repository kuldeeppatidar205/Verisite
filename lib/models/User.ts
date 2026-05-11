import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'pg_owner' | 'guest';
  collegeEmail?: string;
  studentId?: string;
  universityId?: mongoose.Types.ObjectId;
  hostelName?: string;
  roomNumber?: string;
  phoneNumber?: string;
  verified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'pg_owner', 'guest'], default: 'student' },
    collegeEmail: { type: String, unique: true, sparse: true, lowercase: true },
    studentId: { type: String },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    hostelName: { type: String },
    roomNumber: { type: String },
    phoneNumber: { type: String },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
