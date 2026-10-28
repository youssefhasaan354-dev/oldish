/**
 * Shared Rate Limiting Helper using Upstash Redis REST API
 * with in-memory Map fallback for local/serverless instances without Upstash configured.
 */

const localMemoryHits = new Map();

/**
 * Extracts normalized client IP from request headers or socket.
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Checks and increments rate limit for a client IP.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ limit: number, windowMs: number, prefix: string }} options
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number }>}
 */
export async function checkRateLimit(req, res, { limit = 5, windowMs = 5 * 60 * 1000, prefix = 'rl:' } = {}) {
  const clientIp = getClientIp(req);
  const windowSec = Math.ceil(windowMs / 1000);
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis REST Attempt
  if (upstashUrl && upstashToken) {
    try {
      const key = `${prefix}${clientIp}`;
      // Pipeline: INCR key, EXPIRE key windowSec NX, TTL key
      const response = await fetch(`${upstashUrl.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSec, 'NX'],
          ['TTL', key]
        ])
      });

      if (response.ok) {
        const data = await response.json();
        // data format: [{ result: count }, { result: 1|0 }, { result: ttl }]
        const currentCount = Number(data[0]?.result || 1);
        const ttl = Number(data[2]?.result || windowSec);
        const remaining = Math.max(0, limit - currentCount);
        const allowed = currentCount <= limit;
        const retryAfter = ttl > 0 ? ttl : windowSec;

        res.setHeader('X-RateLimit-Limit', String(limit));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        if (!allowed) {
          res.setHeader('Retry-After', String(retryAfter));
        }

        return { allowed, remaining, retryAfter };
      } else {
        console.warn('[rateLimit] Upstash Redis returned non-200, falling back to local memory map:', response.status);
      }
    } catch (err) {
      console.warn('[rateLimit] Upstash Redis error, falling back to local memory map:', err.message);
    }
  }

  // 2. In-Memory Map Fallback
  const now = Date.now();
  const cacheKey = `${prefix}${clientIp}`;
  const timestamps = (localMemoryHits.get(cacheKey) || []).filter(t => now - t < windowMs);

  const allowed = timestamps.length < limit;
  if (allowed) {
    timestamps.push(now);
    localMemoryHits.set(cacheKey, timestamps);
  }

  const remaining = Math.max(0, limit - timestamps.length);
  const retryAfter = Math.ceil(windowMs / 1000);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfter));
  }

  // Clean stale entries periodically
  if (localMemoryHits.size > 2000) {
    for (const [k, ts] of localMemoryHits.entries()) {
      if (ts.every(t => now - t >= windowMs)) {
        localMemoryHits.delete(k);
      }
    }
  }

  return { allowed, remaining, retryAfter };
}
