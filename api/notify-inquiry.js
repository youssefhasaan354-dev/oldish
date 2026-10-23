// In-memory rate limiting map: ip -> array of timestamps
const ipHits = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. IP Rate Limiting (max 5 requests per 5 minutes per IP)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim()) 
    : (req.socket?.remoteAddress || 'unknown');

  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxHits = 5;

  res.setHeader('X-RateLimit-Limit', String(maxHits));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxHits - currentHits.length - 1)));
  if (currentHits.length >= maxHits) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  currentHits.push(now);
  ipHits.set(clientIp, currentHits);

  // Periodically clean stale entries if map gets too large
  if (ipHits.size > 2000) {
    for (const [key, timestamps] of ipHits.entries()) {
      if (timestamps.every(t => now - t >= windowMs)) {
        ipHits.delete(key);
      }
    }
  }

  // 2. Parse & Validate Payload
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }
  const payload = body || {};

  // Ignore honeypot hits silently
  if (payload.honeypot && typeof payload.honeypot === 'string' && payload.honeypot.trim().length > 0) {
    return res.status(200).json({ success: true, ignored: true });
  }

  const trimField = (val, maxLen) => {
    if (!val || typeof val !== 'string') return '';
    return val.trim().slice(0, maxLen);
  };

  const name = trimField(payload.name, 100);
  const phone = trimField(payload.phone, 30);
  const email = trimField(payload.email, 100);
  const type = trimField(payload.type, 50) || 'reservation_request';
  const branch = trimField(payload.branch, 100) || 'Downtown Cairo';
  const date = trimField(payload.date, 30);
  const time = trimField(payload.time, 30);
  const guests = trimField(payload.guests, 20);
  const message = trimField(payload.message, 1000);

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  const typeLabels = {
    reservation_request: 'طلب حجز طاولة (Table Reservation)',
    event_request: 'مناسبة خاصة أو حجز مجموعات (Private Event)',
    contact_inquiry: 'استفسار عام (Contact Inquiry)'
  };
  const typeTitle = typeLabels[type] || type;

  const results = {
    telegram: 'not_configured',
    email: 'not_configured'
  };

  // 3. Telegram Notification (Optional)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    try {
      const tgText = [
        `🛎 *طلب جديد في مطعم وكافيه أولديش*`,
        `────────────────────`,
        `📌 *النوع / Type:* ${typeTitle}`,
        `👤 *الاسم / Name:* ${name}`,
        `📞 *الهاتف / Phone:* ${phone}`,
        email ? `✉️ *البريد / Email:* ${email}` : null,
        date ? `📅 *التاريخ / Date:* ${date} ${time ? `(${time})` : ''}` : null,
        guests ? `👥 *العدد / Guests:* ${guests}` : null,
        branch ? `📍 *الفرع / Branch:* ${branch}` : null,
        message ? `💬 *ملاحظات / Message:* ${message}` : null,
        `────────────────────`,
        `⏰ *التوقيت:* ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`
      ].filter(Boolean).join('\n');

      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: tgText,
          parse_mode: 'Markdown'
        })
      });

      results.telegram = tgRes.ok ? 'sent' : `error_${tgRes.status}`;
    } catch (err) {
      console.warn('Telegram notification error:', err);
      results.telegram = 'network_error';
    }
  }

  // 4. Resend Email Notification (Optional)
  const resendKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.NOTIFICATION_EMAIL || process.env.OWNER_EMAIL;

  if (resendKey && ownerEmail) {
    try {
      const emailContent = `
New inquiry submitted on Oldish website:
- Type: ${typeTitle}
- Name: ${name}
- Phone: ${phone}
- Email: ${email || 'N/A'}
- Date & Time: ${date || 'N/A'} ${time ? `(${time})` : ''}
- Party Size: ${guests || 'N/A'}
- Branch: ${branch}
- Message / Notes:
${message || 'None'}
      `.trim();

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: 'Oldish Restaurant <onboarding@resend.dev>',
          to: [ownerEmail],
          subject: `[Oldish] New ${type === 'reservation_request' ? 'Reservation' : 'Inquiry'} from ${name}`,
          text: emailContent
        })
      });

      results.email = emailRes.ok ? 'sent' : `error_${emailRes.status}`;
    } catch (err) {
      console.warn('Resend email error:', err);
      results.email = 'network_error';
    }
  }

  return res.status(200).json({ success: true, results });
}
