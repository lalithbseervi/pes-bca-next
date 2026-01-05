import { NextResponse } from "next/server";
import { TokenVerificationService } from "./lib/services/TokenVerificationService";

// Define CORS configuration
const corsOptions = {
  allowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
  allowedOrigins: process.env.DEVELOPMENT === 'false' ? ["http://localhost:3000", "*"] : ["https://pes-bca.pages.dev"],
  allowedHeaders: ["Content-Type", "Authorization", "If-None-Match"],
  exposedHeaders: [],
  maxAge: "86400", // 24 hours
  credentials: "true",
};

/**
 * Paths that don't require authentication
 */
const PUBLIC_PATHS = ["/api/authenticate"];

export async function proxy(request) {
  // Skip authentication check for public paths
  if (!PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    const auth_result = await validateRequest(request);
    
    if (!auth_result.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: auth_result.message,
          reason: auth_result.reason
        },
        { status: auth_result.status }
      );
    }

    // Attach user context to request for downstream handlers
    request.user = auth_result.user_context;
  }

  const response = NextResponse.next();

  // If token was refreshed, set new access_token cookie
  const auth_result = await validateRequest(request);
  if (auth_result.valid && auth_result.new_access_token) {
    response.cookies.set("access_token", auth_result.new_access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    });
  }

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") ?? "";
    const isAllowedOrigin =
      corsOptions.allowedOrigins.includes("*") ||
      corsOptions.allowedOrigins.includes(origin);

    const preflightHeaders = {
      "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "*",
      "Access-Control-Allow-Methods": corsOptions.allowedMethods.join(","),
      "Access-Control-Allow-Headers": corsOptions.allowedHeaders.join(","),
      "Access-Control-Allow-Credentials": corsOptions.credentials,
      "Access-Control-Max-Age": corsOptions.maxAge,
    };

    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Set CORS headers for all requests
  const origin = request.headers.get("origin") ?? "";
  if (
    corsOptions.allowedOrigins.includes("*") ||
    corsOptions.allowedOrigins.includes(origin)
  ) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
`;
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);

  // Only set Content-Type to JSON for non-file routes
  if (!request.nextUrl.pathname.includes("/api/download")) {
    response.headers.set("Content-Type", "application/json");
  }

  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  response.headers.set(
    "Access-Control-Allow-Credentials",
    corsOptions.credentials
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    corsOptions.allowedMethods.join(",")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    corsOptions.allowedHeaders.join(",")
  );
  response.headers.set(
    "Access-Control-Expose-Headers",
    corsOptions.exposedHeaders.join(",")
  );

  response.headers.set("Access-Control-Max-Age", corsOptions.maxAge);

  if (!response.headers.get('Cache-Control') || !response.headers.get('ETag')) {
    response.headers.set('Cache-Control', 'private, max-age=3600, must-revalidate, immutable, stale-if-error=3600');
  }

  return response;
}

/**
 * Validate request authentication and refresh tokens if needed
 * @param {Request} request
 * @returns {object} {valid: boolean, message?: string, reason?: string, status?: number, user_context?: object, new_access_token?: string}
 */
async function validateRequest(request) {
  const access_token = request.cookies.get("access_token")?.value;
  const refresh_token = request.cookies.get("refresh_token")?.value;

  // Check if tokens exist
  if (!access_token && !refresh_token) {
    return {
      valid: false,
      message: "Unauthorized",
      reason: "missing_auth_tokens",
      status: 401,
    };
  }

  try {
    const token_service = new TokenVerificationService(
      process.env.JWT_SECRET,
      process.env.REFRESH_JWT_SECRET
    );

    const auth_result = await token_service.getUserContext(access_token, refresh_token);

    if (!auth_result.valid) {
      return {
        valid: false,
        message: "Unauthorized",
        reason: "invalid_or_expired_token",
        status: 401,
      };
    }

    return {
      valid: true,
      user_context: auth_result.user_context,
      new_access_token: auth_result.new_access_token,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return {
      valid: false,
      message: "Internal Server Error",
      reason: "token_verification_failed",
      status: 500,
    };
  }
}

export const config = {
  matcher: "/api/:path*",
};
