import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Proxy images from the HTTP backend through Next.js (HTTPS)
 * to avoid Mixed Content errors on Vercel.
 *
 * Usage: /api/proxy-image?url=http://47.129.159.61:8000/static/images/foo.jpg
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: upstream.statusText ? upstream.status : 502 }
      )
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg"
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })
  }
}
