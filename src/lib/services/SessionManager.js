import { createLogger } from "@/lib/logger.js";

const log = createLogger('SessionManager');

export class SessionManager {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async getSession(user_id, device_id) {
    const { data: session } = await this.supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user_id)
      .eq("device_id", device_id)
      .single();

    if (!session) {
      log.warn(`No session found for user: ${user_id}`);
    }
    return session || null;
  }

  async createSession(user_id, device_id, access_token, refresh_token, expires_at) {
    const { data: new_session, error } = await this.supabase
      .from("sessions")
      .upsert(
        {
          user_id: user_id,
          device_id: device_id,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: expires_at,
          last_refreshed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: ["user_id", "device_id"] }
      )
      .select("*")
      .single();

    if (error) {
      log.error(`Failed to create session: ${user_id}`, error);
      throw error;
    }
    log.info(`Session created: ${new_session.id}`);
    return new_session;
  }

  async updateSession(session_id, access_token, refresh_token, expires_at, last_refreshed) {
    await this.supabase
      .from("sessions")
      .update({
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expires_at,
        last_refreshed: last_refreshed,
      })
      .eq("id", session_id);
  }

  async updateAccessToken(session_id, access_token, expires_at, last_refreshed) {
    await this.supabase
      .from("sessions")
      .update({
        access_token: access_token,
        expires_at: expires_at,
        last_refreshed: last_refreshed,
      })
      .eq("id", session_id);
  }
}
