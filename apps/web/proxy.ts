import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server"

// Nice-to-have only (#34): refreshes the auth session on every request so
// Server Components see fresh state. Route protection is NOT enforced here;
// sign-in-to-save is enforced server-side in each Convex mutation.
export default convexAuthNextjsMiddleware()

export const config = {
  // Run on all routes except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
