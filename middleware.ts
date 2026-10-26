export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/materials/:path*",
    "/topics/:path*",
    "/quiz/:path*",
    "/report/:path*",
    "/plan/:path*",
    "/assistant/:path*",
    "/progress/:path*",
    "/voice/:path*",
    "/lecturer/:path*",
    "/students/:path*",
    "/settings/:path*",
  ],
};
