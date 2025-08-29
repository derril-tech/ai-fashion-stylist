import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateOutfit } from '@/lib/outfit-rules';

export async function GET() {
  const checks: { name: string; ok: boolean; info?: any }[] = [];

  // DB check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.push({ name: 'database', ok: true });
  } catch (e: any) {
    checks.push({ name: 'database', ok: false, info: e?.message || String(e) });
  }

  // Env check (presence only)
  const envs = ['AWS_REGION', 'AWS_S3_BUCKET', 'WEATHER_API_KEY'];
  const missing = envs.filter((k) => !process.env[k]);
  checks.push({ name: 'env_vars', ok: missing.length === 0, info: { missing } });

  // Rules engine check
  try {
    const res = validateOutfit([
      { colors: ['white'], texture: 'smooth', formality: 'casual', category: 'tops' },
      { colors: ['blue'], texture: 'textured', formality: 'casual', category: 'bottoms' },
      { colors: ['white'], texture: 'smooth', formality: 'casual', category: 'shoes' },
    ] as any);
    checks.push({ name: 'rules_engine', ok: typeof res.isValid === 'boolean', info: { score: res.score } });
  } catch (e: any) {
    checks.push({ name: 'rules_engine', ok: false, info: e?.message || String(e) });
  }

  const ok = checks.every((c) => c.ok);
  return NextResponse.json({ ok, checks });
}
