import { Pool } from 'pg';

declare global {
    var _pgPool: Pool | undefined;
}

const pool: Pool =
    global._pgPool ||
    new Pool({
        user: process.env.DB_USER || 'postgres',
        password: String(process.env.DB_PASSWORD || ''),
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'it_assets',
    });

if (process.env.NODE_ENV !== 'production') {
    global._pgPool = pool;
}

export default pool;