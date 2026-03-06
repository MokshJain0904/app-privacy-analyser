import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('privaguard_session')
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')

    if (!session && !isAuthPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (session && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (public APIs)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
