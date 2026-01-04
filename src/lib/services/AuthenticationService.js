import {
  getDeviceId,
  resolveSemesterFromUsername,
  resolveCourseId,
} from "@/lib/auth_helpers";
import { TokenManager } from "./TokenManager";
import { SessionManager } from "./SessionManager";
import { UserManager } from "./UserManager";

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

    // Case 1: User exists and has a session on this device
    try {
      if (user) {
        const session = await this.session_manager.getSession(
          user.id,
          device_id
        );
        if (session) {
          return await this.handleExistingSession(
            user,
            session,
            username,
            password
          );
        }
      }

      // Case 2: No existing session, authenticate with external API
      const profile = await this.authenticateWithAPI(username, password);

      // Case 3: User doesn't exist, create new user
      if (!user) {
        try {
          const course_id = await resolveCourseId({ username, profile });
          const current_semester = await this.resolveSemesterFromProfile(
            username,
            profile
          );
          user = await this.user_manager.createNewUser(
            username,
            course_id,
            current_semester
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            {
              status: 400,
            }
          );
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
      const profile = await this.authenticateWithAPI(username, password);
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

      session_profile.access_token = access_token;
      session_profile.refresh_token = session.refresh_token;
    } else {
      session_profile.access_token = session.access_token;
      session_profile.refresh_token = session.refresh_token;
    }

    // Update last login
    await this.user_manager.updateLastLogin(user.id);

    // Enrich profile with additional data
    await this.enrichSessionProfile(session_profile, user);

    return session_profile;
  }

  async createNewSession(user, profile, device_id) {
    const course_code = profile.srn.match(
      /^PES[1-2]UG\d{2}([A-Z]{2})\d{3}$/i
    )[1];

    const session_profile = {
      ...profile,
      course_id: user.course_id,
      user_id: user.id,
      course_code: course_code,
      current_semester: user.current_semester,
    };

    const { access_token, refresh_token } =
      await this.token_manager.generateTokenPair(user.id, session_profile);

    await this.session_manager.createSession(
      user.id,
      device_id,
      access_token,
      refresh_token,
      this.token_manager.getExpiresAt()
    );

    // Enrich profile with additional data
    await this.enrichSessionProfile(session_profile, user);
    session_profile.access_token = access_token;
    session_profile.refresh_token = refresh_token;

    return session_profile;
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

  async authenticateWithAPI(username, password) {
    const response = await fetch(this.auth_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, profile: true }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const { profile } = await response.json();
    return profile;
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
