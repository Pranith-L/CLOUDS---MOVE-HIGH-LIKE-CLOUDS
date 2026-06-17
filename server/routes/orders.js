import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || key_id.startsWith('rzp_test_your')) {
    throw new Error('Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env');
  }
  return new Razorpay({ key_id, key_secret });
};

router.post('/create-payment', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    const rzp = getRazorpay();
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };
    const order = await rzp.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/verify-and-place', authenticate, async (req, res) => {
  try {
    const {
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
      items, shippingAddress, total
    } = req.body;

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      orderItems.push({
        product: product._id,
        productName: product.name,
        productColor: product.color,
        productColorHex: product.colorHex,
        size: item.size,
        quantity: item.quantity,
        price: product.price,
        customization: item.customization || {}
      });
    }

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      total,
      shippingAddress,
      payment: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid'
      },
      status: 'confirmed'
    });

    await order.save();
    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/all', authenticate, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
