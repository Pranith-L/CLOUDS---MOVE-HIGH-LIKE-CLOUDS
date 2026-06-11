import mongoose from 'mongoose';

const supportReplySchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportRequest', required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    fromStaff: { type: Boolean, default: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export default mongoose.model('SupportReply', supportReplySchema);
