export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkBearerAuth } from '@/lib/auth-utils'

const PRO_PRICE_PER_USER = 12

export async function GET(req: NextRequest) {
  try {
    if (!process.env.ADMIN_PASSWORD) {
      console.error('[admin] ADMIN_PASSWORD env var is not set')
      return NextResponse.json({ error: 'Admin access not configured' }, { status: 500 })
    }

    // Constant-time comparison — `===` leaks the length of the matching prefix.
    if (!checkBearerAuth(req.headers.get('authorization'), process.env.ADMIN_PASSWORD)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Run all stats queries in parallel
    const [
      totalUsersResult,
      totalLessonsResult,
      totalWorksheetsResult,
      proUsersResult,
      freeUsersResult,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('worksheets').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'pro'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('subscription_status', ['free', 'cancelled']),
    ])

    if (
      totalUsersResult.error ||
      totalLessonsResult.error ||
      totalWorksheetsResult.error ||
      proUsersResult.error ||
      freeUsersResult.error
    ) {
      console.error('[admin] Query errors:', {
        totalUsers: totalUsersResult.error,
        totalLessons: totalLessonsResult.error,
        totalWorksheets: totalWorksheetsResult.error,
        proUsers: proUsersResult.error,
        freeUsers: freeUsersResult.error,
      })
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const totalUsers = totalUsersResult.count ?? 0
    const totalLessons = totalLessonsResult.count ?? 0
    const totalWorksheets = totalWorksheetsResult.count ?? 0
    const proUsers = proUsersResult.count ?? 0
    const freeUsers = freeUsersResult.count ?? 0
    const mrr = proUsers * PRO_PRICE_PER_USER

    return NextResponse.json(
      {
        totalUsers,
        totalLessons,
        totalWorksheets,
        proUsers,
        freeUsers,
        mrr,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[admin] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
