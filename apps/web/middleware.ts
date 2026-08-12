import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server';

// Pass through all requests so client-side React handles auth redirection smoothly
export default convexAuthNextjsMiddleware();

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
