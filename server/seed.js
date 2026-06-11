import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import User from './models/User.js';

dotenv.config();

const products = [
  {
    name: 'CLOUDS Classic Black Tee',
    color: 'black',
    colorHex: '#0a0a0a',
    price: 699,
    description: 'The darkest canvas for your boldest designs. Premium 100% cotton, pre-shrunk, ultra-soft.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    slug: 'clouds-classic-black',
    image: '',
    stock: 100,
    featured: true
  },
  {
    name: 'CLOUDS Sky Blue Tee',
    color: 'blue',
    colorHex: '#2563a8',
    price: 699,
    description: 'Ocean-deep blue for a statement look. Premium 100% cotton, breathable and comfortable.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    slug: 'clouds-sky-blue',
    image: '',
    stock: 100,
    featured: true
  },
  {
    name: 'CLOUDS Warm Beige Tee',
    color: 'beige',
    colorHex: '#d4b896',
    price: 699,
    description: 'Earthy warmth with a premium feel. Perfect for subtle, artistic designs.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    slug: 'clouds-warm-beige',
    image: '',
    stock: 100,
    featured: true
  },
  {
    name: 'CLOUDS Pure White Tee',
    color: 'white',
    colorHex: '#f8f8f8',
    price: 699,
    description: 'Clean slate for unlimited creativity. Pure white, vibrant print-ready fabric.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    slug: 'clouds-pure-white',
    image: '',
    stock: 100,
    featured: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clouds-store');
    console.log('✅ Connected to MongoDB');
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');
    const inserted = await Product.insertMany(products);
    console.log(`✅ Seeded ${inserted.length} products:`);
    inserted.forEach(p => console.log(`   - ${p.name} (${p.color})`));

    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@clouds.store').toLowerCase();
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const plain = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
      admin = await User.create({
        name: 'CLOUDS Admin',
        email: adminEmail,
        password: plain,
        role: 'admin'
      });
      console.log(`✅ Created admin user: ${adminEmail} (password: ${plain})`);
    } else {
      console.log(`ℹ️  Admin already exists: ${adminEmail}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
