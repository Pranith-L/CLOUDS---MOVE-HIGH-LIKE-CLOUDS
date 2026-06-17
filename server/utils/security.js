const WEAK_JWT_SECRETS = new Set([
  'clouds_super_secret_jwt_key_change_this_in_production',
  'secret',
  'jwt_secret',
  'your_jwt_secret',
  'changeme'
]);

export function assertJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48');
  }
  if (WEAK_JWT_SECRETS.has(secret)) {
    throw new Error('JWT_SECRET is a known weak default. Set a unique random value in server/.env');
  }
}

export function assertAdminSeedPassword(password) {
  const plain = (password || '').trim();
  if (plain.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.');
  }
  if (plain === 'Admin123!') {
    throw new Error('SEED_ADMIN_PASSWORD cannot be the public default Admin123!');
  }
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}
