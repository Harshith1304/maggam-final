import { NextResponse } from 'next/server';
import { storageStatus } from '@/lib/backend';

export const dynamic = 'force-dynamic';

// Public and harmless: only says whether the site is using files or the database.
//   https://your-site/api/status/   ->   {"storage":"database","onVercel":true,"missingDatabase":false}
export async function GET() {
  return NextResponse.json(storageStatus(), { headers: { 'Cache-Control': 'no-store' } });
}
