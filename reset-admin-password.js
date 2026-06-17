/**
 * One-time fix for production admin login.
 * Run against your Atlas DB (same MONGODB_URI as Render):
 *
 *   MONGODB_URI="mongodb+srv://..." SEED_ADMIN_EMAIL="admin@clouds.com" SEED_ADMIN_PASSWORD="your-strong-password" node reset-admin-password.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ensureDefaultAdmin } from './server/utils/ensureAdmin.js';

dotenv.config({ path: './server/.env' });

if (!process.env.MONGODB_URI) {
  console.error('❌ Set MONGODB_URI to your production Atlas connection string.');
  process.exit(1);
}

process.env.SEED_ADMIN_SYNC_PASSWORD = 'true';

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await ensureDefaultAdmin({ required: true });
    console.log('Done. Sign in on the live site with SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
