import { checkRateLimit, getClientIp } from './_lib/rateLimit.js';
import { sendInquiryNotification } from './_lib/notifications.js';
import { getAdminFirestore } from './_lib/firebaseAdmin.js';

const ALLOWED_BODY_KEYS = new Set([
  'type',
  'name',
  'phone',
  'email',
  'date',
  'time',
  'guests',
  'message',
  'branch',
  'honeypot',
  'turnstileToken',
  'token'
]);

const ALLOWED_TYPES = new Set([
  'reservation_request',
  'event_request',
  'contact_inquiry'
]);

const PHONE_REGEX = /^\+?[0-9\s\-()]{6,30}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TIME_REGEX = /^[0-9]{1,2}:[0-9]{2}(\s?(AM|PM|am|pm))?$/;

export default async function handler(req, res) {
  // 1. Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 2. IP Rate Limiting (max 5 requests per 5 minutes per IP)
  const rateLimitResult = await checkRateLimit(req, res, {
    limit: 5,
    windowMs: 5 * 60 * 1000,
    prefix: 'rl:submit-inquiry:'
  });

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many reservation requests. Please try again later or call us directly.'
    });
  }

  // 3. Parse JSON Body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON request payload' });
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ success: false, error: 'Request body must be a valid JSON object' });
  }

  // 4. Reject unknown extra fields
  const bodyKeys = Object.keys(body);
  const extraKeys = bodyKeys.filter(k => !ALLOWED_BODY_KEYS.has(k));
  if (extraKeys.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Unexpected field(s) not allowed: ${extraKeys.join(', ')}`
    });
  }

  // 5. Honeypot Check: silently accept bots without writing or notifying
  const honeypot = typeof body.honeypot === 'string' ? body.honeypot.trim() : '';
  if (honeypot.length > 0) {
    return res.status(200).json({ success: true, ignored: true });
  }

  // 6. Turnstile Verification (Server-Side)
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const turnstileToken = body.turnstileToken || body.token;

  if (turnstileSecret) {
    if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.trim().length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Security verification failed: missing Turnstile token.'
      });
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', turnstileSecret);
      formData.append('response', turnstileToken.trim());
      const clientIp = getClientIp(req);
      if (clientIp && clientIp !== 'unknown') {
        formData.append('remoteip', clientIp);
      }

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return res.status(403).json({
          success: false,
          error: 'Cloudflare Turnstile verification failed',
          codes: verifyData['error-codes']
        });
      }
    } catch (err) {
      console.error('[submit-inquiry] Turnstile network error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify security token with Cloudflare'
      });
    }
  } else {
    console.warn('[submit-inquiry] TURNSTILE_SECRET_KEY is not configured; skipping token verification.');
  }

  // 7. Strict Field Validations (matching firestore.rules)
  const {
    type = 'reservation_request',
    name,
    phone,
    email,
    date,
    time,
    guests,
    message,
    branch = 'Downtown Cairo'
  } = body;

  // Type validation
  if (!ALLOWED_TYPES.has(type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid inquiry type. Must be one of: ${Array.from(ALLOWED_TYPES).join(', ')}`
    });
  }

  // Name validation: 2-100 characters
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Name is required and must be between 2 and 100 characters.'
    });
  }

  // Phone validation: 6-30 characters, valid international/local phone format
  if (typeof phone !== 'string' || phone.trim().length < 6 || phone.trim().length > 30 || !PHONE_REGEX.test(phone.trim())) {
    return res.status(400).json({
      success: false,
      error: 'A valid phone number is required (between 6 and 30 digits/characters).'
    });
  }

  // Email validation (optional): if present, max 100 chars and valid format
  let cleanEmail = null;
  if (email !== undefined && email !== null && String(email).trim() !== '') {
    const trimmedEmail = String(email).trim();
    if (trimmedEmail.length > 100 || !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Provided email address is invalid or exceeds 100 characters.'
      });
    }
    cleanEmail = trimmedEmail;
  }

  // Date validation (optional): YYYY-MM-DD, valid calendar date, and not in the past (Africa/Cairo)
  let cleanDate = null;
  if (date !== undefined && date !== null && String(date).trim() !== '') {
    const trimmedDate = String(date).trim();
    if (trimmedDate.length > 30 || !DATE_REGEX.test(trimmedDate)) {
      return res.status(400).json({
        success: false,
        error: 'Provided date must match YYYY-MM-DD format.'
      });
    }

    const [year, month, day] = trimmedDate.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        error: 'Provided date is not a valid calendar date.'
      });
    }

    const todayCairo = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
    if (trimmedDate < todayCairo) {
      return res.status(400).json({
        success: false,
        error: 'Reservation date cannot be in the past.'
      });
    }

    cleanDate = trimmedDate;
  }

  // Time validation (optional): HH:MM (AM/PM)
  let cleanTime = null;
  if (time !== undefined && time !== null && String(time).trim() !== '') {
    const trimmedTime = String(time).trim();
    if (trimmedTime.length > 20 || !TIME_REGEX.test(trimmedTime)) {
      return res.status(400).json({
        success: false,
        error: 'Provided time format is invalid.'
      });
    }
    cleanTime = trimmedTime;
  }

  // Guests validation (optional): integer between 1 and 20
  let cleanGuests = null;
  if (guests !== undefined && guests !== null && String(guests).trim() !== '') {
    const numGuests = Number(guests);
    if (!Number.isInteger(numGuests) || numGuests < 1 || numGuests > 20) {
      return res.status(400).json({
        success: false,
        error: 'Party size (guests) must be an integer between 1 and 20.'
      });
    }
    cleanGuests = String(numGuests);
  }

  // Message validation (optional): max 1000 characters
  let cleanMessage = null;
  if (message !== undefined && message !== null && String(message).trim() !== '') {
    const trimmedMessage = String(message).trim();
    if (trimmedMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message notes must not exceed 1000 characters.'
      });
    }
    cleanMessage = trimmedMessage;
  }

  // Branch validation (optional): max 100 characters
  let cleanBranch = 'Downtown Cairo';
  if (branch !== undefined && branch !== null && String(branch).trim() !== '') {
    const trimmedBranch = String(branch).trim();
    if (trimmedBranch.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Branch name must not exceed 100 characters.'
      });
    }
    cleanBranch = trimmedBranch;
  }

  // 8. Server-side Write to Firestore using Firebase Admin SDK
  let docId = '';
  const nowIso = new Date().toISOString();

  try {
    const db = getAdminFirestore();
    const docRef = db.collection('inquiries').doc();
    docId = docRef.id;

    const inquiryDoc = {
      id: docId,
      type,
      name: name.trim(),
      phone: phone.trim(),
      email: cleanEmail,
      date: cleanDate,
      time: cleanTime,
      guests: cleanGuests,
      message: cleanMessage,
      branch: cleanBranch,
      status: 'new',
      created_at: nowIso,
      honeypot: ''
    };

    await docRef.set(inquiryDoc);

    // 9. Asynchronously dispatch Telegram/Resend notifications (failure won't fail the request)
    sendInquiryNotification(inquiryDoc).catch(notifyErr => {
      console.warn('[submit-inquiry] Notification error:', notifyErr);
    });

    return res.status(200).json({
      success: true,
      id: docId
    });
  } catch (err) {
    console.error('[submit-inquiry] Firestore write error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to record reservation request on the server. Please try again or call us directly.'
    });
  }
}

