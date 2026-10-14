const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'it_assets',
  password: 'Y0du!123',
  port: 5432,
});

async function checkPassword() {
  try {
    await client.connect();
    const res = await client.query("SELECT email, password_hash FROM users WHERE email='asset.mgmt@yodu.id'");
    console.log(res.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkPassword();
