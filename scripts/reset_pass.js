const crypto = require('crypto');
const { Client } = require('pg');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset_pass.js <email> <new_password>');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'it_assets'}`;

const client = new Client({
  connectionString: dbUrl,
});

async function resetPassword() {
  try {
    await client.connect();

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(newPassword, salt, 64).toString('hex');
    const password_hash = `${salt}:${hash}`;

    await client.query("UPDATE users SET password_hash = $1 WHERE email = $2", [password_hash, email]);
    console.log('Password reset successfully for', email);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

resetPassword();