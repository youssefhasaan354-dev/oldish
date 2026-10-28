import { checkRateLimit, getClientIp } from './_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. IP Rate Limiting (max 15 requests per 5 minutes per IP)
  const rateLimitResult = await checkRateLimit(req, res, {
    limit: 15,
    windowMs: 5 * 60 * 1000,
    prefix: 'rl:turnstile:'
  });

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If server secret key is not set, silently allow/bypass
    return res.status(200).json({ success: true, bypassed: true });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const { token } = body || {};
  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing Turnstile response token' });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    const clientIp = getClientIp(req);
    if (clientIp && clientIp !== 'unknown') {
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
