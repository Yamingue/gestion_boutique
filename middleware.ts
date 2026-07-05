import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Routes réservées aux admins
    const adminRoutes = [
      "/backoffice/utilisateurs",
      "/backoffice/categories",
      "/backoffice/catalogue/nouveau",
      "/backoffice/catalogue/",        // /catalogue/[id]/modifier
      "/backoffice/clients/",          // /clients/[id]/modifier
      "/backoffice/fournisseurs",
      "/backoffice/reappro",
    ];

    const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));

    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/backoffice/dashboard", req.url));
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
  matcher: ["/backoffice/:path*"],
};
