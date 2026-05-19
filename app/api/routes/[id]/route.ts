import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

const parseJson = (val: unknown) =>
  typeof val === 'string' ? JSON.parse(val) : val ?? {}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const routeId = Number(id)
  if (!Number.isInteger(routeId) || routeId <= 0) {
    return NextResponse.json({ error: 'Invalid route id' }, { status: 400 })
  }

  const { rows } = await pool.query(
    `SELECT
       id, route_id, order_index,
       ST_X(geom) AS lng, ST_Y(geom) AS lat,
       image_path, scene_description,
       urban_morphology, vegetation,
       surface_and_flood, health_livability,
       confidence_scores
     FROM street_analyses
     WHERE route_id = $1
       AND route_id IS NOT NULL
       AND ST_X(geom) != 0
       AND ST_Y(geom) != 0
     ORDER BY order_index ASC`,
    [routeId]
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Route not found' }, { status: 404 })
  }

  const points = rows.map((row) => ({
    id: row.id,
    orderIndex: row.order_index,
    coordinates: [Number(row.lng), Number(row.lat)] as [number, number],
    imagePath: row.image_path,
    sceneDescription: row.scene_description,
    urbanMorphology: parseJson(row.urban_morphology),
    vegetation: parseJson(row.vegetation),
    surfaceAndFlood: parseJson(row.surface_and_flood),
    healthLivability: parseJson(row.health_livability),
    confidenceScores: parseJson(row.confidence_scores),
  }))

  return NextResponse.json({
    routeId,
    totalPoints: points.length,
    points,
  })
}
