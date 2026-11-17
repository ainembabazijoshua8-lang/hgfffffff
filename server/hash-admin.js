// server/hash-admin.js — generate a scrypt hash for ADMIN_PASSWORD
// Usage: node server/hash-admin.js "your-strong-password"
// Then set ADMIN_PASSWORD=<output> in your .env (keep ADMIN_USERNAME too).
import crypto from 'node:crypto';

function hashAdminPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: node server/hash-admin.js "<password>"');
  process.exit(1);
}
console.log(hashAdminPassword(pw));
