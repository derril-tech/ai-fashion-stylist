import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    ts: new Date().toISOString(),
    version: process.env.NEXT_BUILD_ID || 'dev'
  });
}
