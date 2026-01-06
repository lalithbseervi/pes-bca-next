import { TokenVerificationService } from "./services/TokenVerificationService";
import { createLogger } from "./logger";

const log = createLogger('auth_middleware');

/**
 * Verify if the request is from an authenticated admin user
 * @param {Request} request - The incoming request
 * @returns {Promise<{isAdmin: boolean, userId: number|null, error: string|null}>}
 */
export async function verifyAdminAccess(request) {
  try {
    const tokenService = TokenVerificationService.create();
    const result = await tokenService.verifyRequest(request);

    if (!result.valid) {
      return { isAdmin: false, userId: null, error: "Unauthorized" };
    }

    const profile = result.payload?.profile;
    
    if (!profile?.is_admin) {
      log.warn('Non-admin user attempted to access admin endpoint:', profile?.user_id);
      return { isAdmin: false, userId: profile?.user_id, error: "Forbidden: Admin access required" };
    }

    return { isAdmin: true, userId: profile.user_id, error: null };
  } catch (error) {
    log.error('Error verifying admin access:', error);
    return { isAdmin: false, userId: null, error: "Internal server error" };
  }
}

/**
 * Middleware wrapper for admin-only API routes
 * @param {Function} handler - The API route handler function
 * @returns {Function} - Wrapped handler with admin check
 */
export function withAdminAuth(handler) {
  return async (request, context) => {
    const { isAdmin, error } = await verifyAdminAccess(request);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: error || "Admin access required" }),
        { status: error === "Unauthorized" ? 401 : 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return handler(request, context);
  };
}
