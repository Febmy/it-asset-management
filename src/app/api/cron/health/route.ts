import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getEnv } from '@/lib/env';

export async function GET(request: Request) {
    try {
        // Required security check for CRON_SECRET_TOKEN
        const authHeader = request.headers.get('authorization');
        const cronSecret = getEnv().CRON_SECRET_TOKEN;

        if (!cronSecret) {
            throw new Error('CRON_SECRET_TOKEN environment variable is required');
        }
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized cron trigger' },
                { status: 401 }
            );
        }

        // Check database connectivity
        let dbStatus = 'healthy';
        let dbLatencyMs = 0;
        try {
            const dbStart = Date.now();
            await pool.query('SELECT 1');
            dbLatencyMs = Date.now() - dbStart;
        } catch (dbError) {
            dbStatus = 'unhealthy';
            console.error('Health check DB error:', dbError);
        }

        // Check memory usage
        const memoryUsage = process.memoryUsage();
        const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const memoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

        // Check uptime
        const uptimeSeconds = Math.floor(process.uptime());
        const uptimeFormatted = `${Math.floor(uptimeSeconds / 86400)}d ${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;

        // Overall health status
        const overallStatus = dbStatus === 'healthy' && memoryPercent < 90 ? 'healthy' : 'degraded';

        return NextResponse.json({
            success: true,
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: uptimeFormatted,
            checks: {
                database: {
                    status: dbStatus,
                    latency_ms: dbLatencyMs,
                },
                memory: {
                    used_mb: memoryUsedMB,
                    total_mb: memoryTotalMB,
                    percent: memoryPercent,
                    status: memoryPercent < 90 ? 'healthy' : 'warning',
                },
                environment: process.env.NODE_ENV || 'development',
            },
        });
    } catch (error) {
        console.error('Cron health check error:', error);
        return NextResponse.json(
            { success: false, message: 'Health check failed', status: 'unhealthy' },
            { status: 500 }
        );
    }
}