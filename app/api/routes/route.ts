import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { rows } = await pool.query<{ route_id: number; total_points: string }>(
    `SELECT route_id, COUNT(*) AS total_points
     FROM street_analyses
     WHERE route_id IS NOT NULL
     GROUP BY route_id
     ORDER BY route_id ASC`
  )

  const routes = rows.map((row) => ({
    routeId: row.route_id,
    totalPoints: Number(row.total_points),
  }))

  return NextResponse.json({ routes })
}
