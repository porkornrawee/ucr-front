import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { rows } = await pool.query<{ now: string }>('SELECT NOW()')
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: rows[0].now,
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
