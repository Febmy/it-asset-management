const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'it_assets',
  password: 'Y0du!123',
  port: 5432,
});

async function inspectAssets() {
  try {
    await client.connect();
    const count = await client.query("SELECT COUNT(*) FROM assets;");
    console.log("Total assets:", count.rows[0].count);

    const byPrefix = await client.query(`
      SELECT substring(asset_tag from 1 for 10) as prefix, COUNT(*), min(created_at), max(created_at)
      FROM assets
      GROUP BY substring(asset_tag from 1 for 10)
      ORDER BY count DESC;
    `);
    console.log("Assets by prefix:");
    console.table(byPrefix.rows);

    const first20 = await client.query("SELECT id, asset_tag, brand, model, serial_number, status, created_at FROM assets ORDER BY id ASC LIMIT 25;");
    console.log("First 25 assets:");
    console.table(first20.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

inspectAssets();

