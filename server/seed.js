import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import { DEFAULT_PRODUCTS } from './data/defaultProducts.js';
import { ensureDefaultAdmin } from './utils/ensureAdmin.js';
import { isProduction } from './utils/security.js';

dotenv.config();

async function seed() {
  try {
    if (isProduction()) {
      const { assertJwtSecret } = await import('./utils/security.js');
      assertJwtSecret();
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clouds-store');
    console.log('✅ Connected to MongoDB');
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');
    const inserted = await Product.insertMany(DEFAULT_PRODUCTS);
    console.log(`✅ Seeded ${inserted.length} products:`);
    inserted.forEach(p => console.log(`   - ${p.name} (${p.color})`));

    await ensureDefaultAdmin({ required: true });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message || err);
    process.exit(1);
  }
}

seed();
