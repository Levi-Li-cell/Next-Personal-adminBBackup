import { NextRequest, NextResponse } from 'next/server';
import { auth } from './index';

export async function adminMiddleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || !session.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 检查用户是否有admin角色
  if (!((session.user as any).role) || (session.user as any).role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
