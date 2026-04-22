const FROM = 'Tyoutor Pro <info@tyoutorpro.io>'

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
    subject: 'Welcome to Tyoutor Pro — your first lesson is waiting',
    html: `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
  <div style="background:linear-gradient(135deg,#2D6A4F,#40916C);padding:24px 32px;border-radius:8px 8px 0 0;">
    <span style="font-size:18px;font-weight:800;color:white;">Tyoutor <span style="color:#FFD4C4;">Pro</span></span>
  </div>
  <div style="background:white;padding:40px;border:1px solid #EEEEE8;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="font-size:28px;font-weight:800;color:#1A1A1A;margin:0 0 16px;">Welcome to Tyoutor Pro! ✏️</h1>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">You're 60 seconds away from your first tailored lesson plan. Set up your class once — Tyoutor Pro remembers everything.</p>
    <a href="https://tyoutorpro.io/onboarding" style="display:inline-block;background:#2D6A4F;color:white;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;text-decoration:none;">Generate my first lesson →</a>
    <p style="font-size:12px;color:#BBB;margin:16px 0 0;">5 free lessons. No credit card required.</p>
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
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 16px;">Your Pro subscription is now active. Here's what you've unlocked:</p>
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

export async function sendUsageResetEmail(email: string, name: string) {
  const firstName = name?.split(' ')[0] || 'there'
  return sendEmail({
    to: email,
    subject: 'Your free lessons have reset for this month',
    html: `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
  <div style="background:linear-gradient(135deg,#2D6A4F,#40916C);padding:24px 32px;border-radius:8px 8px 0 0;">
    <span style="font-size:18px;font-weight:800;color:white;">Tyoutor <span style="color:#FFD4C4;">Pro</span></span>
  </div>
  <div style="background:white;padding:40px;border:1px solid #EEEEE8;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="font-size:24px;font-weight:800;color:#1A1A1A;margin:0 0 16px;">New month, new lessons 📚</h1>
    <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px;">Hey ${firstName}, your 5 free lesson generations have just reset. Happy planning!</p>
    <a href="https://tyoutorpro.io/dashboard/lesson-generator" style="display:inline-block;background:#2D6A4F;color:white;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;text-decoration:none;">Generate a Lesson →</a>
  </div>
  <div style="padding:16px 32px;">
    <p style="font-size:11px;color:#BBB;">Tyoutor Pro · tyoutorpro.io</p>
  </div>
</div>`,
  })
}
