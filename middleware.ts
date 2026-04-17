import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Routes réservées aux admins
    const adminRoutes = [
      "/utilisateurs",
      "/categories",
      "/catalogue/nouveau",
      "/catalogue/",        // /catalogue/[id]/modifier
      "/clients/",          // /clients/[id]/modifier
      "/fournisseurs",
      "/reappro",
    ];

    const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));

    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
