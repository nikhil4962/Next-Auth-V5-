import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);
 
export default auth((req) => {
 /* if (!req) {
    console.error("Request object is null or undefined");
    return new Response("Bad Request", { status: 400 });
  } */

 const { nextUrl } = req;

 /*if (!nextUrl) {
  console.error("nextUrl is null or undefined");
  return new Response("Bad Request", { status: 400 });
} */ 

 const isLoggedIn  = !!req.auth;

 const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
 const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
 const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if(isApiAuthRoute) {
   // return new Response(null, { status: 204 });
    return;
  };

  if(isAuthRoute) {
    if(isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    }
    //return new Response(null, { status: 204 });
      return;
  }
    if(!isLoggedIn && !isPublicRoute) {
      let callbackUrl = nextUrl.pathname;
      if(nextUrl.search) {
        callbackUrl += nextUrl.search;
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl);

      return Response.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
    };
   
   // return new Response(null, { status: 204 });
    //return;
});
 
// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};