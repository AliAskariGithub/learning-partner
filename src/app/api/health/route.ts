import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';


export async function GET() {
  const results: {
    postgres: { status: string; version?: string; profilesCount?: number; error?: string };
    neonAuth: { status: string; baseUrl?: string; jwksConfigured?: boolean; error?: string };
  } = {
    postgres: { status: 'pending' },
    neonAuth: { status: 'pending' },
  };

  // 1. Test Neon Postgres connection & Drizzle query
  try {
    const rawResult = await db.execute<{ version: string }>(sql`SELECT version()`);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(profiles);
    
    results.postgres = {
      status: 'ok',
      version: (rawResult.rows?.[0] as any)?.version || 'Connected',
      profilesCount: Number(countResult[0]?.count ?? 0),
    };
  } catch (err: any) {
    results.postgres = {
      status: 'error',
      error: err?.message || String(err),
    };
  }

  // 2. Test Neon Auth service
  try {
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL;

    // Verify JWKS endpoint accessibility from Neon Auth
    let jwksOk = false;
    if (jwksUrl) {
      const jwksRes = await fetch(jwksUrl, { cache: 'no-store' });
      if (jwksRes.ok) {
        jwksOk = true;
      }
    }

    results.neonAuth = {
      status: jwksOk ? 'ok' : 'degraded',
      baseUrl: baseUrl || 'missing',
      jwksConfigured: jwksOk,
    };
  } catch (err: any) {
    results.neonAuth = {
      status: 'error',
      error: err?.message || String(err),
    };
  }

  const allOk = results.postgres.status === 'ok' && results.neonAuth.status === 'ok';

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: results,
    },
    { status: allOk ? 200 : 500 }
  );
}
