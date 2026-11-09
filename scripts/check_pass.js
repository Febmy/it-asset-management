const { Client } = require('pg');

const email = process.argv[2];
const password = process.argv[3];

if (!email) {
  console.error('Usage: node scripts/check_pass.js <email>');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'it_assets'}`;

const client = new Client({
  connectionString: dbUrl,
});

async function checkPassword() {
  try {
    await client.connect();
    const res = await client.query("SELECT email, password_hash FROM users WHERE email = $1", [email]);
    console.log(res.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkPassword();