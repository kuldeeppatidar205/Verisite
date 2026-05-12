import mongoose, { Schema, Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  emailDomains: string[];
  createdAt: Date;
}

const universitySchema = new Schema<IUniversity>(
  {
    name: { type: String, required: true, unique: true },
    emailDomains: { type: [String], required: true },
  },
  { timestamps: true }
);

universitySchema.index({ name: 1 });

export const University = mongoose.models.University || mongoose.model<IUniversity>('University', universitySchema);
