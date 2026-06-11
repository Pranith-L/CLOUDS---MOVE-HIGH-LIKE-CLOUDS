import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  productColor: String,
  productColorHex: String,
  size: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: Number,
  customization: {
    frontImage: String,
    backImage: String,
    hasCustomization: { type: Boolean, default: false }
  }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    name: String, street: String, city: String,
    state: String, pincode: String, phone: String
  },
  payment: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
