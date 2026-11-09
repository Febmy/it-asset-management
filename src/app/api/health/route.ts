import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  let database = 'disconnected';

  try {
    // Run lightweight query to check database connection
    await pool.query('SELECT 1');
    database = 'connected';
  } catch {
    // Database connection failed
    database = 'disconnected';
  }

  const status = database === 'connected' ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp,
      uptime,
      database,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}