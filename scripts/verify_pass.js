const crypto = require('crypto');

const hashString = '583fee734d9ca94f3f3101384b9eeae2:16571b213f1efc29ff5c70be712cbc8727a998a3e3d9708b53d46cb6eabc65a7bc719bc6d822e5f291cf11f66267f19c7ffdbf99dee1a7cfbe4a65360141c3b7';
const [salt, storedHash] = hashString.split(':');

function verifyPassword(password) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return derivedKey === storedHash;
}

console.log('Y0du!123', verifyPassword('Y0du!123'));
