const crypto = require('crypto');
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'it_assets',
  password: 'Y0du!123',
  port: 5432,
});

async function resetPassword() {
  try {
    await client.connect();
    
    const password = 'Password123!';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const password_hash = `${salt}:${hash}`;
    
    await client.query("UPDATE users SET password_hash = $1 WHERE email = 'asset.mgmt@yodu.id'", [password_hash]);
    console.log('Password reset successfully to', password);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

resetPassword();
