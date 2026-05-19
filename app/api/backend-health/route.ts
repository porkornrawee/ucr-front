import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function probe(url: string): Promise<'ok' | 'error'> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

export async function GET() {
  const backendUrl = `http://${process.env.BACKEND_DOMAIN}:${process.env.BACKEND_PORT}/health`
  const geoserverUrl = process.env.FRIEND_GEOSERVER_URL ?? ''

  const [backend, geoserver] = await Promise.all([
    probe(backendUrl),
    probe(geoserverUrl),
  ])

  return NextResponse.json({ backend, geoserver })
}
