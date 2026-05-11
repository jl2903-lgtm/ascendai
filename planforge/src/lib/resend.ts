const FROM = process.env.RESEND_FROM_EMAIL || 'Tyoutor Pro <info@mail.tyoutorpro.io>'

export interface EmailPayload {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[resend] RESEND_API_KEY not set — skipping email')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[resend] API error', res.status, body)
      return { success: false, error: body }
    }
    return { success: true }
  } catch (err) {
    console.error('[resend] fetch error', err)
    return { success: false, error: String(err) }
  }
}

export async function sendWelcomeEmail(email: string, _name: string) {
  return sendEmail({
    to: email,
    subject: 'Your 7-day free trial has started — welcome to Tyoutor Pro',
    html: `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
  <div style="background:linear-gradient(135deg,#2D6A4F,#40916C);padding:24px 32px;border-radius:8px 8px 0 0;">
    <span style="font-size:18px;font-weight:800;color:white;">Tyoutor <span style="color:#FFD4C4;">Pro</span></span>
  </div>
  <div style="background:white;padding:40px;border:1px solid #EEEEE8;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="font-size:28px;font-weight:800;color:#1A1A1A;margin:0 0 16px;">Your 7-day free trial has started! ✏️</h1>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 16px;">You have full access to all 6 tools for the next 7 days — no restrictions.</p>
    <ul style="font-size:15px;color:#444;line-height:2;padding-left:20px;margin:0 0 24px;">
      <li>Unlimited lesson generation</li>
      <li>Unlimited worksheets with answer keys</li>
      <li>Error Coach, Demo Lesson Builder, Job Assistant</li>
      <li>PDF export on everything</li>
      <li>Saved library &amp; class profiles</li>
    </ul>
    <a href="https://tyoutorpro.io/onboarding" style="display:inline-block;background:#2D6A4F;color:white;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;text-decoration:none;">Set up my first lesson →</a>
    <p style="font-size:12px;color:#BBB;margin:16px 0 0;">After 7 days, $12/month. Cancel anytime from settings — no charge if you cancel before day 7.</p>
  </div>
  <div style="padding:16px 32px;">
    <p style="font-size:11px;color:#BBB;">Tyoutor Pro · tyoutorpro.io</p>
  </div>
</div>`,
  })
}

export async function sendTrialEndingReminderEmail(email: string, name: string, daysLeft: number) {
  const firstName = name?.split(' ')[0] || 'there'
  return sendEmail({
    to: email,
    subject: `Your Tyoutor Pro trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
  <div style="background:linear-gradient(135deg,#92400E,#B45309);padding:24px 32px;border-radius:8px 8px 0 0;">
    <span style="font-size:18px;font-weight:800;color:white;">Tyoutor <span style="color:#FFD4C4;">Pro</span></span>
  </div>
  <div style="background:white;padding:40px;border:1px solid #EEEEE8;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="font-size:24px;font-weight:800;color:#1A1A1A;margin:0 0 16px;">⚠️ Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}, ${firstName}</h1>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 16px;">After your trial ends, your card will be charged $12/month automatically and you'll keep full Pro access.</p>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">If you'd like to cancel, you can do so in one click from your settings page — no charge will be made.</p>
    <a href="https://tyoutorpro.io/dashboard/settings" style="display:inline-block;background:#2D6A4F;color:white;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;text-decoration:none;margin-right:12px;">Go to Settings</a>
    <a href="https://tyoutorpro.io/dashboard" style="display:inline-block;background:#F5F4F0;color:#2D2D2D;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;text-decoration:none;">Continue using Pro</a>
  </div>
  <div style="padding:16px 32px;">
    <p style="font-size:11px;color:#BBB;">Tyoutor Pro · tyoutorpro.io</p>
  </div>
</div>`,
  })
}

export async function sendUpgradeConfirmationEmail(email: string, name: string) {
  const firstName = name?.split(' ')[0] || 'there'
  return sendEmail({
    to: email,
    subject: "You're now on Pro — unlimited lessons await",
    html: `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
  <div style="background:linear-gradient(135deg,#2D6A4F,#40916C);padding:24px 32px;border-radius:8px 8px 0 0;">
    <span style="font-size:18px;font-weight:800;color:white;">Tyoutor <span style="color:#FFD4C4;">Pro</span></span>
  </div>
  <div style="background:white;padding:40px;border:1px solid #EEEEE8;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="font-size:24px;font-weight:800;color:#1A1A1A;margin:0 0 16px;">You're all set, ${firstName}! 🎉</h1>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 16px;">Your trial has converted to a Pro subscription. Here's what you've unlocked:</p>
    <ul style="font-size:15px;color:#444;line-height:2;padding-left:20px;margin:0 0 24px;">
      <li>Unlimited lesson generation</li>
      <li>Unlimited worksheets</li>
      <li>All teaching tools — unlimited</li>
      <li>PDF export on everything</li>
      <li>Full saved library &amp; class profiles</li>
    </ul>
    <a href="https://tyoutorpro.io/dashboard" style="display:inline-block;background:#2D6A4F;color:white;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;text-decoration:none;">Go to Dashboard →</a>
  </div>
  <div style="padding:16px 32px;">
    <p style="font-size:11px;color:#BBB;">Tyoutor Pro · tyoutorpro.io</p>
  </div>
</div>`,
  })
}
