import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestsTotal);

export const apiLatencyMs = new client.Histogram({
  name: 'api_latency_ms',
  help: 'API latency in milliseconds',
  labelNames: ['route', 'method'],
  buckets: [50, 100, 200, 400, 800, 1600, 3200]
});
register.registerMetric(apiLatencyMs);

export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

export function recordRequestMetrics(route: string, method: string, status: number, durationMs: number) {
  try {
    httpRequestsTotal.inc({ method, route, status: String(status) }, 1);
    apiLatencyMs.observe({ route, method }, durationMs);
  } catch {}
}

export { register };
