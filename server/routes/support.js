import express from 'express';
import jwt from 'jsonwebtoken';
import SupportRequest from '../models/SupportRequest.js';
import SupportReply from '../models/SupportReply.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { sendMail } from '../utils/mail.js';

const router = express.Router();

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

function notifyInbox() {
  return (process.env.SUPPORT_NOTIFY_EMAIL || process.env.SMTP_USER || '').trim();
}

// Create support request (public; attach user if JWT present)
router.post('/requests', optionalAuth, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject and message are required.' });
    }
    const doc = new SupportRequest({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      user: req.user?.id || null
    });
    await doc.save();
    const inbox = notifyInbox();
    if (inbox) {
      await sendMail({
        to: inbox,
        subject: `[CLOUDS Support] ${doc.subject}`,
        text: `New request #${doc._id}\nFrom: ${doc.name} <${doc.email}>\n\n${doc.message}`
      });
    }
    res.status(201).json({
      message: 'Request received. We will reply by email.',
      request: { id: doc._id, subject: doc.subject, status: doc.status, createdAt: doc.createdAt }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List requests (own threads, or all for admin)
router.get('/requests', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = {
        $or: [{ user: req.user.id }, { email: String(req.user.email).toLowerCase() }]
      };
    }
    const items = await SupportRequest.find(query).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Single request + replies (owner or admin)
router.get('/requests/:id', authenticate, async (req, res) => {
  try {
    const reqDoc = await SupportRequest.findById(req.params.id).lean();
    if (!reqDoc) return res.status(404).json({ message: 'Not found.' });
    const isOwner =
      (reqDoc.user && String(reqDoc.user) === String(req.user.id)) ||
      String(reqDoc.email).toLowerCase() === String(req.user.email).toLowerCase();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const replies = await SupportReply.find({ request: reqDoc._id })
      .sort({ createdAt: 1 })
      .populate('author', 'name email')
      .lean();
    res.json({ request: reqDoc, replies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff reply → saved + email to customer
router.post('/requests/:id/replies', authenticate, isAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Reply message is required.' });
    }
    const reqDoc = await SupportRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: 'Not found.' });
    const reply = await SupportReply.create({
      request: reqDoc._id,
      body: String(message).trim(),
      fromStaff: true,
      author: req.user.id
    });
    reqDoc.status = 'replied';
    await reqDoc.save();
    const customerMail = await sendMail({
      to: reqDoc.email,
      subject: `Re: ${reqDoc.subject} — CLOUDS`,
      text: `Hi ${reqDoc.name},\n\nThank you for contacting CLOUDS. Here is our reply:\n\n${reply.body}\n\n— CLOUDS Support\n\n---\nYour original message:\n${reqDoc.message}`
    });
    res.status(201).json({
      reply,
      mail: customerMail.skipped ? 'logged_only' : customerMail.sent ? 'sent' : 'failed'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
