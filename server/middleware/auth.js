import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/** Admin check always reads role from DB (JWT role alone is not trusted). */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Not authenticated.' });
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only.' });
    }
    req.user.role = user.role;
    next();
  } catch {
    res.status(500).json({ message: 'Authorization check failed.' });
  }
};
