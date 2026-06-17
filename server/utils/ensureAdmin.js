import User from '../models/User.js';
import { assertAdminSeedPassword } from './security.js';

function adminEmailFromEnv() {
  return (process.env.SEED_ADMIN_EMAIL || 'admin@clouds.com').toLowerCase().trim();
}

function adminPasswordFromEnv() {
  return (process.env.SEED_ADMIN_PASSWORD || '').trim();
}

function syncPasswordEnabled() {
  return String(process.env.SEED_ADMIN_SYNC_PASSWORD || '').toLowerCase() === 'true';
}

async function applyAdminPassword(user, plain, { force = false } = {}) {
  if (!plain) return false;

  const hasPassword = Boolean(user.password);
  if (hasPassword && !force) return false;

  assertAdminSeedPassword(plain);
  user.password = plain;
  user.markModified('password');
  return true;
}

/**
 * Ensure a production admin exists (Render startup).
 * Uses SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD from env.
 * Set SEED_ADMIN_SYNC_PASSWORD=true once to reset the admin password on Render.
 */
export async function ensureDefaultAdmin({ required = false } = {}) {
  const adminEmail = adminEmailFromEnv();
  const plain = adminPasswordFromEnv();
  const forcePassword = syncPasswordEnabled();

  let existing = await User.findOne({ email: adminEmail }).select('+password');

  if (existing) {
    let changed = false;

    if (existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
      console.log(`✅ Promoted ${adminEmail} to admin`);
    }

    if (!existing.password && plain) {
      try {
        const updated = await applyAdminPassword(existing, plain);
        if (updated) {
          changed = true;
          console.log(`✅ Set password for ${adminEmail} (account had no password, e.g. social sign-in)`);
        }
      } catch (err) {
        console.error(`❌ Admin password setup failed: ${err.message}`);
        if (required) process.exit(1);
        return;
      }
    } else if (forcePassword && plain) {
      try {
        await applyAdminPassword(existing, plain, { force: true });
        changed = true;
        console.log(`✅ Synced admin password for ${adminEmail} (SEED_ADMIN_SYNC_PASSWORD=true)`);
        console.log('   Remove SEED_ADMIN_SYNC_PASSWORD from Render after you sign in successfully.');
      } catch (err) {
        console.error(`❌ Admin password sync failed: ${err.message}`);
        if (required) process.exit(1);
        return;
      }
    }

    if (changed) {
      await existing.save();
    } else if (existing.role === 'admin' && existing.password) {
      console.log(`ℹ️  Admin user ready: ${adminEmail}`);
      if (!forcePassword) {
        console.log('   If login fails, set SEED_ADMIN_SYNC_PASSWORD=true on Render, redeploy once, then remove it.');
      }
    }
    return;
  }

  if (!plain) {
    const msg = `No admin user in database (${adminEmail}). Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.`;
    if (required) {
      console.error(`❌ ${msg} (12+ chars, not Admin123!)`);
      process.exit(1);
    }
    console.warn(`⚠️  ${msg} on Render, then redeploy.`);
    return;
  }

  try {
    assertAdminSeedPassword(plain);
  } catch (err) {
    console.error(`❌ Admin bootstrap skipped: ${err.message}`);
    if (required) process.exit(1);
    return;
  }

  await User.create({
    name: 'CLOUDS Admin',
    email: adminEmail,
    password: plain,
    role: 'admin'
  });

  console.log(`✅ Created admin user: ${adminEmail}`);
  console.log('   Sign in on the live site with SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD.');
}

/** Lightweight status for /api/health (no secrets). */
export async function getAdminBootstrapStatus() {
  const adminEmail = adminEmailFromEnv();
  const user = await User.findOne({ email: adminEmail }).select('+password role');
  return {
    email: adminEmail,
    exists: Boolean(user),
    hasPassword: Boolean(user?.password),
    role: user?.role || null,
    seedPasswordConfigured: Boolean(adminPasswordFromEnv()),
    syncPasswordEnabled: syncPasswordEnabled()
  };
}
