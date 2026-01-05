import { createLogger } from "@/lib/logger.js";

const log = createLogger('UserManager');

export class UserManager {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async getUserByUsername(username) {
    const { data: user } = await this.supabase
      .from("users")
      .select("*")
      .eq("college_id", username.toUpperCase())
      .single();

    if (!user) {
      log.warn(`User not found for username: ${username}`);
    }
    return user || null;
  }

  async createNewUser(username, course_id, current_semester) {
    const { data: new_user } = await this.supabase
      .from("users")
      .insert({
        college_id: username.toUpperCase(),
        course_id: course_id,
        current_semester: current_semester,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      })
      .select("*")
      .single();

    return new_user;
  }

  async updateLastLogin(user_id) {
    await this.supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user_id);
  }

  async getCurrentSemesterDB(course_id, semester_number) {
    const { data: semester } = await this.supabase
      .from("semesters")
      .select("id")
      .eq("course_id", course_id)
      .eq("semester_number", semester_number)
      .single();

    return semester;
  }

  async getCourseById(course_id) {
    if (!course_id) return null;
    const { data: course } = await this.supabase
      .from("courses")
      .select("id, course_code, course_name")
      .eq("id", course_id)
      .single();

    return course || null;
  }
}
