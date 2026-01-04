import { signJWT, verifyJWT } from "@/lib/sign_jwt.js";

export class TokenManager {
  constructor(jwt_secret, refresh_secret, access_ttl, refresh_ttl) {
    this.jwt_secret = jwt_secret;
    this.refresh_secret = refresh_secret;
    this.access_ttl = access_ttl;
    this.refresh_ttl = refresh_ttl;
  }

  async generateAccessToken(user_id, profile) {
    return await signJWT(
      { sub: user_id, type: "access", profile },
      this.jwt_secret,
      this.access_ttl
    );
  }

  async generateRefreshToken(user_id, profile) {
    return await signJWT(
      { sub: user_id, type: "refresh", profile },
      this.refresh_secret,
      this.refresh_ttl
    );
  }

  async generateTokenPair(user_id, profile) {
    const [access_token, refresh_token] = await Promise.all([
      this.generateAccessToken(user_id, profile),
      this.generateRefreshToken(user_id, profile),
    ]);
    return { access_token, refresh_token };
  }

  async verifyAccessToken(token) {
    try {
      return await verifyJWT(token, this.jwt_secret);
    } catch (error) {
      console.error("Failed to verify access token:", error);
      return { valid: false, reason: error.message };
    }
  }

  isTokenExpired(expires_at) {
    return new Date(expires_at).getTime() <= Date.now();
  }

  isRefreshExpired(last_refreshed) {
    return (
      new Date(last_refreshed).getTime() + this.refresh_ttl * 1000 <= Date.now()
    );
  }

  getExpiresAt() {
    return new Date(Date.now() + this.access_ttl * 1000).toISOString();
  }

  getLastRefreshed() {
    return new Date().toISOString();
  }
}
