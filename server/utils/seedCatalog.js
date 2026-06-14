import Product from '../models/Product.js';
import { DEFAULT_PRODUCTS } from '../data/defaultProducts.js';

/** Insert the 4 default tees when the catalog is empty (e.g. fresh Render + Atlas DB). */
export async function ensureDefaultProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return count;
  const inserted = await Product.insertMany(DEFAULT_PRODUCTS);
  console.log(`✅ Seeded ${inserted.length} default products (catalog was empty)`);
  return inserted.length;
}
