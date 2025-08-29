type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function scrubPII(value: any): any {
  if (value == null) return value;
  if (typeof value === 'string') {
    // Redact likely secrets/emails
    if (/apikey|secret|token|password|authorization/i.test(value)) return '[REDACTED]';
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return '[REDACTED_EMAIL]';
    return value;
  }
  if (Array.isArray(value)) return value.map(scrubPII);
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (/apikey|secret|token|password|authorization/i.test(k)) {
        out[k] = '[REDACTED]';
      } else if (/email|phone|address/i.test(k)) {
        out[k] = '[REDACTED_PII]';
      } else {
        out[k] = scrubPII(v);
      }
    }
    return out;
  }
  return value;
}

export function secLog(level: LogLevel, message: string, meta?: Record<string, any>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    meta: scrubPII(meta || {})
  };
  if (level === 'ERROR') console.error('[SEC]', JSON.stringify(entry));
  else if (level === 'WARN') console.warn('[SEC]', JSON.stringify(entry));
  else console.log('[SEC]', JSON.stringify(entry));
}

export function logAuthFailure(reason: string, meta?: Record<string, any>) {
  secLog('WARN', `Auth failure: ${reason}`, meta);
}

export function logAccessDenied(resource: string, meta?: Record<string, any>) {
  secLog('WARN', `Access denied: ${resource}`, meta);
}

export function logAbuse(ip: string, route: string) {
  secLog('WARN', 'Rate limit exceeded', { ip, route });
}
