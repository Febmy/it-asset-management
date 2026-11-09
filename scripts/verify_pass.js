const crypto = require('crypto');

const password = process.argv[2];
const storedHash = process.argv[3];

if (!password || !storedHash) {
  console.error('Usage: node scripts/verify_pass.js <password> <stored_hash>');
  process.exit(1);
}

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return derivedKey === key;
}

console.log(verifyPassword(password, storedHash));