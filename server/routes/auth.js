import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: 'Too many login attempts. Please wait 15 minutes and try again.'
});

const MIN_PASSWORD_LEN = 8;

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required.' });
    if (password.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LEN} characters.` });
    }
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });
    const user = new User({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password
    });
    await user.save();
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join('. ') });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });
    if (!user.password) {
      return res.status(400).json({
        message: 'This account has no password (likely created with Google sign-in). Use Google to sign in, or ask the owner to set SEED_ADMIN_SYNC_PASSWORD=true on Render and redeploy once.'
      });
    }
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password.' });
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found.' });
    res.json(user);
  } catch {
    res.status(401).json({ message: 'Invalid token.' });
  }
});

export default router;
