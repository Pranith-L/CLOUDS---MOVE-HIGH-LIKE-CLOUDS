import mongoose from 'mongoose';

const supportRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 8000 },
    status: {
      type: String,
      enum: ['open', 'replied', 'closed'],
      default: 'open'
    }
  },
  { timestamps: true }
);

supportRequestSchema.index({ createdAt: -1 });
supportRequestSchema.index({ email: 1 });

export default mongoose.model('SupportRequest', supportRequestSchema);
