import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import User from './models/User.js';
import { DEFAULT_PRODUCTS } from './data/defaultProducts.js';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clouds-store');
    console.log('✅ Connected to MongoDB');
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');
    const inserted = await Product.insertMany(DEFAULT_PRODUCTS);
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
