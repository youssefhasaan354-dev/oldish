/**
 * Shared Notification Helper for Telegram and Resend
 */

/**
 * Escapes characters that have special meaning in Telegram HTML parse_mode (& < >).
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sends inquiry notification via Telegram Bot and Resend Email.
 * Safe execution: errors are logged and never throw or fail caller request.
 * @param {Object} inquiry
 * @returns {Promise<{ telegram: string, email: string }>}
 */
export async function sendInquiryNotification(inquiry = {}) {
  const {
    id = '',
    type = 'reservation_request',
    name = '',
    phone = '',
    email = '',
    date = '',
    time = '',
    guests = '',
    branch = 'Downtown Cairo',
    message = ''
  } = inquiry;

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

  // 1. Telegram Notification (Optional)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    try {
      const cairoTime = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
      const tgLines = [
        `🛎 <b>طلب جديد في مطعم وكافيه أولديش</b>`,
        `────────────────────`,
        `🆔 <b>رقم الطلب / ID:</b> <code>${escapeHtml(id)}</code>`,
        `📌 <b>النوع / Type:</b> ${escapeHtml(typeTitle)}`,
        `👤 <b>الاسم / Name:</b> ${escapeHtml(name)}`,
        `📞 <b>الهاتف / Phone:</b> ${escapeHtml(phone)}`,
        email ? `✉️ <b>البريد / Email:</b> ${escapeHtml(email)}` : null,
        date ? `📅 <b>التاريخ / Date:</b> ${escapeHtml(date)}${time ? ` (${escapeHtml(time)})` : ''}` : null,
        guests ? `👥 <b>العدد / Guests:</b> ${escapeHtml(String(guests))}` : null,
        branch ? `📍 <b>الفرع / Branch:</b> ${escapeHtml(branch)}` : null,
        message ? `💬 <b>ملاحظات / Message:</b> ${escapeHtml(message)}` : null,
        `────────────────────`,
        `⏰ <b>التوقيت:</b> ${escapeHtml(cairoTime)}`
      ].filter(Boolean).join('\n');

      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: tgLines,
          parse_mode: 'HTML'
        })
      });

      results.telegram = tgRes.ok ? 'sent' : `error_${tgRes.status}`;
    } catch (err) {
      console.warn('[notifications] Telegram notification error:', err.message);
      results.telegram = 'network_error';
    }
  }

  // 2. Resend Email Notification (Optional)
  const resendKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.NOTIFICATION_EMAIL || process.env.OWNER_EMAIL;

  if (resendKey && ownerEmail) {
    try {
      const emailContent = `
New inquiry submitted on Oldish website:
- ID: ${id}
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
      console.warn('[notifications] Resend email error:', err.message);
      results.email = 'network_error';
    }
  }

  return results;
}
