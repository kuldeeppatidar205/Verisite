import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reviewId: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  },
  { timestamps: true }
);

reportSchema.index({ reviewId: 1 });
reportSchema.index({ reporterId: 1 });

export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', reportSchema);
