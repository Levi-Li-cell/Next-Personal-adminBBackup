import { adminMiddleware } from './src/lib/auth/admin-middleware';

export const middleware = adminMiddleware;

export const config = {
  matcher: ['/dashboard/:path*'],
};
