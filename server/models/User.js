import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    required() {
      return !(this.googleId || this.facebookId || this.instagramId);
    },
    minlength: 6,
    select: false
  },
  googleId: { type: String, sparse: true, unique: true },
  facebookId: { type: String, sparse: true, unique: true },
  instagramId: { type: String, sparse: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
