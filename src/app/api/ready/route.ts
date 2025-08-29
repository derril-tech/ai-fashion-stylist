import { NextResponse } from 'next/server';

export async function GET() {
  // In real setup, check DB/S3 connectivity; here we assume ready if process is alive
  const checks = {
    process: true
  };
  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json({ ready, checks });
}
