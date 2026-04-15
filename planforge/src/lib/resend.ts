import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: 'Tyoutor Pro <hello@tyoutorpro.app>',
      to: email,
      subject: 'Welcome to Tyoutor Pro — your lesson planning just got easier',
      html: `
        <div style="font-family: 'Nunito', Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; color: #2D2D2D; padding: 40px; border-radius: 16px; border: 1px solid #E5E7EB;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0D9488; font-size: 28px; margin: 0; font-weight: 800;">Tyoutor Pro</h1>
          </div>
          <h2 style="font-size: 22px; margin-bottom: 16px; font-weight: 700;">Hey ${name || 'there'}, welcome aboard! 👋</h2>
          <p style="color: #4B5563; line-height: 1.7; margin-bottom: 16px;">
            You've just joined thousands of ESL/EFL teachers who are spending less time planning and more time teaching.
          </p>
          <p style="color: #4B5563; line-height: 1.7; margin-bottom: 16px;">
            With your free account, you get <strong style="color: #2D2D2D;">5 lesson plans</strong> and <strong style="color: #2D2D2D;">5 worksheets</strong> per month — enough to see just how much time this saves you.
          </p>
          <p style="color: #4B5563; line-height: 1.7; margin-bottom: 24px;">
            <strong style="color: #2D2D2D;">Pro tip:</strong> Set up a class profile first — then every tool automatically tailors content to your students' level, nationality, and weak areas.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #0D9488; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px;">
              Start Planning →
            </a>
          </div>
          <p style="color: #9CA3AF; font-size: 13px; margin-top: 32px;">
            Questions? Just reply to this email — a real human will get back to you.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

export async function sendUpgradeConfirmationEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: 'Tyoutor Pro <hello@tyoutorpro.app>',
      to: email,
      subject: "You're now on Pro — unlimited lessons await",
      html: `
        <div style="font-family: 'Nunito', Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; color: #2D2D2D; padding: 40px; border-radius: 16px; border: 1px solid #E5E7EB;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0D9488; font-size: 28px; margin: 0; font-weight: 800;">Tyoutor Pro</h1>
          </div>
          <h2 style="font-size: 22px; margin-bottom: 16px; font-weight: 700;">You're all set, ${name || 'there'}! 🎉</h2>
          <p style="color: #4B5563; line-height: 1.7; margin-bottom: 16px;">
            Your Pro subscription is now active. Here's what you've unlocked:
          </p>
          <ul style="color: #4B5563; line-height: 2;">
            <li>✅ Unlimited lesson generation</li>
            <li>✅ Unlimited worksheets</li>
            <li>✅ All teaching tools — unlimited</li>
            <li>✅ PDF export on everything</li>
            <li>✅ Full saved library</li>
            <li>✅ Class Profiles for AI auto-fill</li>
          </ul>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #0D9488; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px;">
              Go to Dashboard →
            </a>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send upgrade email:', error)
  }
}

export async function sendUsageResetEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: 'Tyoutor Pro <hello@tyoutorpro.app>',
      to: email,
      subject: 'Your free lessons have reset for this month',
      html: `
        <div style="font-family: 'Nunito', Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; color: #2D2D2D; padding: 40px; border-radius: 16px; border: 1px solid #E5E7EB;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0D9488; font-size: 28px; margin: 0; font-weight: 800;">Tyoutor Pro</h1>
          </div>
          <h2 style="font-size: 22px; margin-bottom: 16px; font-weight: 700;">New month, new lessons 📚</h2>
          <p style="color: #4B5563; line-height: 1.7; margin-bottom: 16px;">
            Hey ${name || 'there'}, your 5 free lesson generations have just reset. Happy planning!
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/lesson-generator" style="background: #0D9488; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px;">
              Generate a Lesson →
            </a>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send reset email:', error)
  }
}
