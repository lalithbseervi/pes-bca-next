import { verifyJWT } from "@/lib/sign_jwt";
import { TokenManager } from "./TokenManager";
import { createLogger } from "@/lib/logger";

const log = createLogger('TokenVerificationService');

export class TokenVerificationService {
  constructor(jwt_secret, refresh_jwt_secret, access_ttl = 24 * 60 * 60) {
    this.jwt_secret = jwt_secret;
    this.refresh_jwt_secret = refresh_jwt_secret;
    this.token_manager = new TokenManager(jwt_secret, refresh_jwt_secret, access_ttl, 7 * 24 * 60 * 60);
  }

  /**
   * Generate new access token from refresh token payload
   * @param {string} user_id
   * @param {object} profile
   * @returns {string} new access token
   */
  async generateNewAccessToken(user_id, profile) {
    return await this.token_manager.generateAccessToken(user_id, profile);
  }

  /**
   * Verify access token and return decoded payload
   * @param {string} access_token
   * @returns {object|null} decoded payload or null if invalid
   */
  async verifyAccessToken(access_token) {
    try {
      if (!access_token) {
        log.warn("Access token is missing");
        return null;
      }
      
      const decoded = await verifyJWT(access_token, this.jwt_secret);
      if (!decoded.valid) {
        log.warn("Access token is invalid");
        return null;
      }
      
      // Verify token type is 'access'
      if (decoded.payload?.type !== 'access') {
        log.warn("Token type is not 'access'");
        return null;
      }
      
      return decoded.payload;
    } catch (error) {
      log.error("Failed to verify access token", error);
      return null;
    }
  }

  /**
   * Verify refresh token and return decoded payload
   * @param {string} refresh_token
   * @returns {object|null} decoded payload or null if invalid
   */
  async verifyRefreshToken(refresh_token) {
    try {
      if (!refresh_token) {
        log.warn("Refresh token is missing");
        return null;
      }
      
      const decoded = await verifyJWT(refresh_token, this.refresh_jwt_secret);
      if (!decoded.valid) {
        log.warn("Refresh token is invalid");
        return null;
      }
      
      // Verify token type is 'refresh'
      if (decoded.payload?.type !== 'refresh') {
        log.warn("Token type is not 'refresh'");
        return null;
      }
      
      return decoded.payload;
    } catch (error) {
      log.error("Failed to verify refresh token", error);
      return null;
    }
  }

  /**
   * Verify and get user context from tokens
   * Automatically refreshes access token if expired but refresh token is valid
   * @param {string} access_token
   * @param {string} refresh_token
   * @returns {object|null} {valid: boolean, user_context?: {...}, new_access_token?: string}
   */
  async getUserContext(access_token, refresh_token) {
    // Try to verify access token
    const access_payload = await this.verifyAccessToken(access_token);
    if (access_payload) {
      return {
        valid: true,
        user_context: {
          user_id: access_payload.sub,
          profile: access_payload.profile,
          token_type: 'access',
        },
      };
    }

    // Access token is invalid/expired, try refresh token
    const refresh_payload = await this.verifyRefreshToken(refresh_token);
    if (refresh_payload) {
      try {
        // Generate new access token from refresh token payload
        const new_access_token = await this.generateNewAccessToken(
          refresh_payload.sub,
          refresh_payload.profile
        );

        return {
          valid: true,
          user_context: {
            user_id: refresh_payload.sub,
            profile: refresh_payload.profile,
            token_type: 'refreshed',
          },
          new_access_token,
        };
      } catch (error) {
        log.error("Failed to generate new access token from refresh token", error);
        return { valid: false };
      }
    }

    // Both tokens are invalid/expired
    log.warn("Both access and refresh tokens are invalid/expired");
    return { valid: false };
  }
}
