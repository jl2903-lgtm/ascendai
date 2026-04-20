import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resource_id, reason } = await req.json()
    if (!resource_id) return NextResponse.json({ error: 'Resource ID required' }, { status: 400 })

    // Fetch resource details for the notification email
    const { data: resource } = await supabase
      .from('shared_resources')
      .select('title, uploader_name')
      .eq('id', resource_id)
      .single()

    // Insert the report record (RLS enforces reporter_id = auth.uid())
    const { error } = await supabase
      .from('reported_resources')
      .insert({
        resource_id,
        reporter_id: session.user.id,
        reason: reason || null,
      })
    if (error) throw error

    // Fetch reporter's display name
    const { data: reporter } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', session.user.id)
      .single()
    const reporterName = reporter?.full_name || session.user.email?.split('@')[0] || 'Unknown'

    const safeReason = reason
      ? String(reason).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      : null

    // Send email after the response is returned — non-blocking
    after(async () => { await resend.emails.send({
      from: 'Tyoutor Pro <hello@tyoutorpro.app>',
      to: 'info@tyoutor.io',
      subject: `[Report] ${resource?.title ?? resource_id}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; color: #2D2D2D; padding: 40px; border-radius: 16px; border: 1px solid #E5E7EB;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0D9488; font-size: 22px; margin: 0; font-weight: 800;">Tyoutor Pro</h1>
          </div>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: 700; color: #DC2626; font-size: 15px;">⚑ New resource report</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; width: 130px; vertical-align: top;">Resource</td>
              <td style="padding: 8px 0; font-weight: 600;">${resource?.title ?? resource_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Uploader</td>
              <td style="padding: 8px 0;">${resource?.uploader_name ?? '—'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Reported by</td>
              <td style="padding: 8px 0;">${reporterName} (${session.user.email})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Reason</td>
              <td style="padding: 8px 0;">${safeReason ?? '<em style="color:#9CA3AF">No reason provided</em>'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Resource ID</td>
              <td style="padding: 8px 0; font-size: 12px; color: #9CA3AF;">${resource_id}</td>
            </tr>
          </table>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px; border-top: 1px solid #F3F4F6; padding-top: 16px;">
            Review and take action in the Supabase dashboard → reported_resources table.
          </p>
        </div>
      `,
    }).catch(e => console.error('[report-email]', e)) })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[shared-resources/report]', err)
    return NextResponse.json({ error: 'Could not submit report. Please try again.' }, { status: 500 })
  }
}
