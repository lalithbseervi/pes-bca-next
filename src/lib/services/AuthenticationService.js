import {
  getDeviceId,
  resolveSemesterFromUsername,
  resolveCourseId,
} from "@/lib/auth_helpers";
import { TokenManager } from "./TokenManager";
import { SessionManager } from "./SessionManager";
import { UserManager } from "./UserManager";
import { createLogger } from "../logger";

const log = createLogger('AuthenticationService'); 

export class AuthenticationService {
  constructor(
    supabase,
    token_manager,
    session_manager,
    user_manager,
    auth_endpoint
  ) {
    this.supabase = supabase;
    this.token_manager = token_manager;
    this.session_manager = session_manager;
    this.user_manager = user_manager;
    this.auth_endpoint = auth_endpoint;
  }

  static create(supabase, auth_endpoint) {
    const token_manager = new TokenManager(
      process.env.JWT_SECRET,
      process.env.REFRESH_JWT_SECRET,
      24 * 60 * 60, // ACCESS_TTL: 24h
      7 * 24 * 60 * 60 // REFRESH_TTL: 7d
    );
    const session_manager = new SessionManager(supabase);
    const user_manager = new UserManager(supabase);

    return new AuthenticationService(
      supabase,
      token_manager,
      session_manager,
      user_manager,
      auth_endpoint
    );
  }

  async authenticate(username, password, user_agent) {
    const device_id = await getDeviceId(username, user_agent);
    let user = await this.user_manager.getUserByUsername(username);
    let profile;

    // Case 1: User exists and has a session on this device
    try {
      if (user) {
        // If shadow profile, check expires_at
        if (user.shadow === true && user.expires_at && Date.now() > user.expires_at) {
          log.warn(`Shadow profile for ${username} expired, forcing re-authentication`);
          user = null;
        }
        const session = user ? await this.session_manager.getSession(
          user.id,
          device_id
        ) : null;
        if (session) {
          return await this.handleExistingSession(
            user,
            session,
            username,
            password
          );
        } 
      } else {
        log.info('user not found');
      }

      // Case 2: No existing session, authenticate with external API
      profile = await this.authenticateWithAPI(username, password, user);

      // Case 3: User doesn't exist, create new user
      if (!user) {
        let course_id;
        let current_semester;
        try {
          course_id = await this.resolveCourseIdSafely({ username, profile });
          current_semester = await this.resolveSemesterFromProfile(
            username,
            profile
          );
          user = await this.user_manager.createNewUser(
            username,
            course_id,
            current_semester
          );
        } catch (err) {
          log.warn("User creation failed, issuing shadow user for degraded auth", err);
          course_id = course_id ?? (await this.resolveCourseIdSafely({ username, profile }));
          current_semester =
            current_semester ?? (await this.resolveSemesterFromProfile(username, profile));
          user = this.buildShadowUser(username, course_id, current_semester);
        }
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        {
          status: 400,
        }
      );
    }
    return await this.createNewSession(user, profile, device_id);
  }

  async handleExistingSession(user, session, username, password) {
    const access_expired =
      !session.access_token ||
      this.token_manager.isTokenExpired(session.expires_at);
    const refresh_expired =
      !session.refresh_token ||
      this.token_manager.isRefreshExpired(session.last_refreshed);

    // Both tokens expired: require re-authentication with auth endpoint
    if (access_expired && refresh_expired) {
      log.info('access and refresh tokens expired')  
      const profile = await this.authenticateWithAPI(username, password, user);
      log.info('profile: ', profile)
      return await this.createNewSession(
        user,
        profile,
        await this.extractDeviceId(username, session)
      );
    }

    let session_profile = await this.extractSessionProfile(
      session.access_token,
      user
    );

    // Only access token expired: regenerate access token
    if (access_expired && !refresh_expired) {
      const access_token = await this.token_manager.generateAccessToken(
        user.id,
        session_profile
      );

      await this.session_manager.updateAccessToken(
        session.id,
        access_token,
        this.token_manager.getExpiresAt(),
        this.token_manager.getLastRefreshed()
      );

      // Update last login
      await this.user_manager.updateLastLogin(user.id);

      // Enrich profile with additional data
      await this.enrichSessionProfile(session_profile, user);

      return {
        profile: session_profile,
        access_token,
        refresh_token: session.refresh_token,
      };
    }

    // Both tokens still valid
    // Update last login
    await this.user_manager.updateLastLogin(user.id);

    // Enrich profile with additional data
    await this.enrichSessionProfile(session_profile, user);

    return {
      profile: session_profile,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };
  }

  async createNewSession(user, profile, device_id) {
    const srnMatch = profile?.srn?.match(
      /^PES[1-2]UG\d{2}([A-Z]{2})\d{3}$/i
    );
    const course_code = profile.course_code || (srnMatch ? srnMatch[1] : null);

    const session_profile = {
      ...profile,
      course_id: user.course_id,
      user_id: user.id,
      course_code: course_code,
      current_semester: user.current_semester,
    };

    const { access_token, refresh_token } =
      await this.token_manager.generateTokenPair(user.id, session_profile);

    if (!user.shadow) {
      try {
        await this.session_manager.createSession(
          user.id,
          device_id,
          access_token,
          refresh_token,
          this.token_manager.getExpiresAt()
        );
      } catch (err) {
        log.warn("Failed to persist session; proceeding with in-memory tokens", err.message);
      }
    }

    // Enrich profile with additional data
    await this.enrichSessionProfile(session_profile, user);

    return {
      profile: session_profile,
      access_token,
      refresh_token,
    };
  }

  async extractDeviceId(username, session) {
    // Extract device_id from session
    return session.device_id;
  }

  async resolveSemesterFromProfile(username, profile) {
    // Try to extract semester from profile.semester
    if (profile.semester && typeof profile.semester === "string") {
      // Check if it's a valid semester format (e.g., 'Sem-1', 'Sem-2', etc.)
      if (profile.semester.match(/^Sem-\d+$/i)) {
        // Extract the number from 'Sem-X' format
        const match = profile.semester.match(/\d+/);
        if (match) return parseInt(match[0]);
      }
    }
    // Fallback to resolving from username if profile semester is invalid (e.g., 'CIE')
    return resolveSemesterFromUsername(username);
  }

  async authenticateWithAPI(username, password, user) {
    let response;

    try {
      response = await fetch(this.auth_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, profile: true, fields: [ "name", "prn", "srn", "program", "branch", "semester" ] }),
      });
    } catch (err) {
      log.error("auth endpoint unreachable, using fallback profile", err);
      return await this.buildProfileFromExistingData(username, user);
    }

    if (response.ok) {
      const { profile } = await response.json();
      return profile;
    }

    if (response.status === 404 || response.status >= 500) {
      log.warn(`auth endpoint unavailable (${response.status}), using fallback profile`);
      return await this.buildProfileFromExistingData(username, user);
    }

    const errorText = await response.text().catch(() => "");
    log.error(`auth endpoint returned ${response.status}: ${errorText}`);
    throw new Error("Invalid credentials");
  }

  buildFallbackProfile(username) {
    const normalized = username.toUpperCase();
    // Minimal profile to allow access when auth service is down; still subject to course/semester resolution.
    return {
      name: normalized,
      srn: normalized,
      prn: normalized,
      program: null,
      branch: null,
      semester: null,
      fallback: true,
    };
  }

  buildShadowUser(username, course_id, current_semester) {
    const normalized = username.toUpperCase();
    // Shadow/fallback profiles valid for 3 hours
    const expires_at = Date.now() + 3 * 60 * 60 * 1000;
    return {
      id: `shadow-${normalized}`,
      college_id: normalized,
      course_id: course_id ?? null,
      current_semester: current_semester ?? 1,
      shadow: true,
      expires_at,
    };
  }

  async buildProfileFromExistingData(username, user) {
    const normalized = username.toUpperCase();
    const expires_at = Date.now() + 3 * 60 * 60 * 1000;
    const baseProfile = { ...this.buildFallbackProfile(normalized), expires_at };

    if (user) {
      baseProfile.srn = user.college_id || normalized;
      baseProfile.prn = user.college_id || normalized;
      baseProfile.semester = user.current_semester || baseProfile.semester;
      baseProfile.course_id = user.course_id || null;
    }

    // Try resolving course_id from username/program if missing
    if (!baseProfile.course_id) {
      const resolved = await this.resolveCourseIdSafely({ username, profile: baseProfile });
      baseProfile.course_id = resolved;
    }

    // Try resolve semester if still missing
    if (!baseProfile.semester) {
      baseProfile.semester = await this.resolveSemesterFromProfile(username, baseProfile);
    }

    // Enrich course_code from DB if possible
    if (baseProfile.course_id) {
      const course = await this.user_manager.getCourseById(baseProfile.course_id);
      if (course?.course_code) {
        baseProfile.course_code = course.course_code;
      }
    }

    // Set 3-hour validity for fallback DB profile
    baseProfile.expires_at = expires_at;
    return baseProfile;
  }

  async resolveCourseIdSafely({ username, profile }) {
    try {
      return await resolveCourseId({ username, profile });
    } catch (err) {
      log.warn("course_id resolution failed, continuing with null", err.message);
      return null;
    }
  }

  async extractSessionProfile(access_token, user) {
    try {
      const decoded = await this.token_manager.verifyAccessToken(access_token);
      if (decoded.valid) {
        return decoded.payload.profile;
      } else {
        return { user_id: user.id, course_id: user.course_id };
      }
    } catch (error) {
      console.error("Failed to extract session profile:", error);
      return { user_id: user.id, course_id: user.course_id };
    }
  }

  async enrichSessionProfile(session_profile, user) {
    const current_semester = resolveSemesterFromUsername(
      session_profile.college_id || user.college_id
    );
    session_profile.current_semester = current_semester;

    const semester_data = await this.user_manager.getCurrentSemesterDB(
      session_profile.course_id || user.course_id,
      current_semester
    );

    if (semester_data) {
      session_profile.current_sem_db = semester_data.id;
    }
  }
}
