import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import aiRoutes from './routes/ai.js';
import oauthRoutes from './routes/oauth.js';
import supportRoutes from './routes/support.js';
import { corsOrigins, clientUrl } from './utils/origins.js';
import { ensureDefaultProducts } from './utils/seedCatalog.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = corsOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clouds-store')
  .then(async () => {
    console.log('✅ MongoDB connected');
    try {
      await ensureDefaultProducts();
    } catch (err) {
      console.error('❌ Product seed error:', err.message);
    }
  })
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '☁️ CLOUDS API is running' });
});

if (process.env.NODE_ENV === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 CLOUDS Server running on port ${PORT}`);
  console.log(`🌐 CLIENT_URL (frontend): ${clientUrl()}`);
  if (process.env.NODE_ENV === 'production' && clientUrl().includes('localhost')) {
    console.warn('⚠️  Set CLIENT_URL to your Vercel URL on Render (e.g. https://your-app.vercel.app)');
  }
});
