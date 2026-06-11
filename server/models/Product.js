import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, enum: ['black', 'blue', 'beige', 'white'], required: true },
  colorHex: { type: String, required: true },
  price: { type: Number, required: true, default: 349 },
  description: { type: String, default: 'Premium quality custom printed tee. 100% cotton, pre-shrunk fabric.' },
  sizes: { type: [String], default: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  slug: { type: String, unique: true, required: true },
  image: { type: String, default: '' },
  stock: { type: Number, default: 100 },
  featured: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
