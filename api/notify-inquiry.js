/**
 * DEPRECATED: This endpoint has been retired.
 * All inquiry submissions and subsequent owner notifications (Telegram & Resend)
 * are handled securely through /api/submit-inquiry.
 */
export default async function handler(req, res) {
  return res.status(410).json({
    success: false,
    error: 'Endpoint deprecated. Inquiries and notifications are processed securely via /api/submit-inquiry.'
  });
}
