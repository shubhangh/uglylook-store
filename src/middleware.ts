import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip non-page routes
  if (
    pathname.startsWith('/adm') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/next') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    const baseUrl = request.nextUrl.origin
    const res = await fetch(
      `${baseUrl}/api/redirects?where[from][equals]=${encodeURIComponent(pathname)}&where[active][equals]=true&limit=1`,
      { next: { revalidate: 60 } }, // cache for 60 seconds
    )

    if (!res.ok) return NextResponse.next()

    const data = await res.json()
    const redirect = data.docs?.[0]

    if (redirect) {
      const statusCode = redirect.type === '302' ? 302 : 301
      const destination = redirect.to.startsWith('http')
        ? redirect.to
        : new URL(redirect.to, request.nextUrl.origin).toString()

      return NextResponse.redirect(destination, statusCode)
    }
  } catch {
    // Don't block page loads if redirect lookup fails
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|assets/).*)',
  ],
}
