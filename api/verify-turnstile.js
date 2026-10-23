// In-memory rate limiting map for Turnstile verification
const ipHits = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. IP Rate Limiting (max 15 requests per 5 minutes per IP)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()) 
    : (req.socket?.remoteAddress || 'unknown');

  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxHits = 15;

  const currentHits = (ipHits.get(clientIp) || []).filter(t => now - t < windowMs);
  if (currentHits.length >= maxHits) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
  }
  currentHits.push(now);
  ipHits.set(clientIp, currentHits);

  // Periodic cleanup if map grows large
  if (ipHits.size > 2000) {
    for (const [key, timestamps] of ipHits.entries()) {
      if (timestamps.every(t => now - t >= windowMs)) {
        ipHits.delete(key);
      }
    }
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If server secret key is not set, silently allow/bypass
    return res.status(200).json({ success: true, bypassed: true });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  const { token } = body || {};
  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing Turnstile response token' });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    if (ip) {
      const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
      formData.append('remoteip', clientIp);
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cloudflare Turnstile verification failed', 
        codes: verifyData['error-codes'] 
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error verifying Turnstile' });
  }
}
