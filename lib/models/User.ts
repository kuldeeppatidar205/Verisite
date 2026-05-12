import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'OWNER' | 'GUEST';
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
    role: { type: String, enum: ['STUDENT', 'OWNER', 'GUEST'], default: 'STUDENT' },
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

userSchema.index({ universityId: 1 });
userSchema.index({ collegeEmail: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
