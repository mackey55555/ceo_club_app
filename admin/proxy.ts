import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証不要なパス（非会員申込みページ）
  const publicPaths = ['/apply'];
  
  // 認証が必要なパス（管理画面）
  const protectedPaths = ['/admin'];

  // 認証不要なパスの場合はそのまま通過
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 管理画面のパスで、ログインページ以外は認証チェック
  if (protectedPaths.some(path => pathname.startsWith(path)) && pathname !== '/admin/login') {
    // クライアント側で認証チェックを行うため、ここではそのまま通過
    // AdminLayoutコンポーネントで認証チェックを実施
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


