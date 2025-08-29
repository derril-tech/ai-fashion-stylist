type RateLimitRule = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

const store = new Map<string, number[]>();

function getClientIp(req: Request): string {
  // Next.js: try standard proxy headers first
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  // As a last resort
  return 'unknown-ip';
}

function makeKey(id: string, ip: string, rule?: RateLimitRule): string {
  const prefix = rule?.keyPrefix || 'rl';
  return `${prefix}:${id}:${ip}`;
}

export async function rateLimit(req: Request, id: string, rule: RateLimitRule = { windowMs: 60_000, max: 60 }): Promise<{ allowed: boolean; remaining: number }>{
  const ip = getClientIp(req);
  const key = makeKey(id, ip, rule);
  const now = Date.now();
  const windowStart = now - rule.windowMs;

  const hits = store.get(key) || [];
  // Remove old timestamps
  const recent = hits.filter((ts) => ts > windowStart);
  recent.push(now);
  store.set(key, recent);

  const allowed = recent.length <= rule.max;
  const remaining = Math.max(0, rule.max - recent.length);
  return { allowed, remaining };
}

export const RATE_RULES = {
  default: { windowMs: 60_000, max: 60 }, // 60/min
  bursty: { windowMs: 10_000, max: 20 },
  heavy: { windowMs: 300_000, max: 200 }, // 200/5min
  sensitive: { windowMs: 60_000, max: 10 }, // 10/min
};
