/**
 * An array of routes that are accesssible to the public
 * These routes do not require authentication
 * @types {string[]}
 */

export const publicRoutes = [
    "/",
    "/auth/new-verification"
];

/**
 * An array of routes that are use dfor authentication
 * These routes will redirect logged in users to /settings
 * @types {string[]}
 */

export const authRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/error",
    "/auth/reset",
    "/auth/new-password"
];

/**
 * The prefix for API authenatication routes 
 * Routes that start with this prefix are used for API authenatication purpose
 * @types {string[]}
 */

export const apiAuthPrefix = "/api/auth";

/**
 * The dafault redircet path after logging in 
 * @types {string[]}
 */

export const DEFAULT_LOGIN_REDIRECT = "/settings";