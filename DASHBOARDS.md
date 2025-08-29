# Dashboards & Metrics

## Prometheus Scrape Example

```
- job_name: ai-fashion-stylist
  metrics_path: /api/metrics
  static_configs:
    - targets: ['localhost:3000']
```

## Key Metrics

- http_requests_total{method,route,status}
- api_latency_ms_bucket{route,method}
- Node.js default metrics (memory, event loop lag)

## Suggested Panels

- Requests by route (bar, last 24h)
- Latency heatmap per route
- Error rate (status >= 500)
- P95 latency per key API
