import { supabase } from "@/lib/supabase";
import { TokenVerificationService } from "@/lib/services/TokenVerificationService";
import { parseCookies } from "@/lib/cookies";
import { createLogger } from "@/lib/logger";

const log = createLogger("profile_complete_route");

export async function POST(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);
    const access_token = cookies["access_token"];
    const refresh_token = cookies["refresh_token"];

    const token_service = new TokenVerificationService(
      process.env.JWT_SECRET,
      process.env.REFRESH_JWT_SECRET
    );

    const auth = await token_service.getUserContext(access_token, refresh_token);
    if (!auth.valid) {
      log.warn("Profile completion request unauthorized");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const user_id = auth.user_context?.user_id;
    const body = await request.json();
    const normalizedCourseId =
      body.course_id !== undefined && body.course_id !== null
        ? Number(body.course_id)
        : null;
    const normalizedSemester =
      body.current_semester !== undefined && body.current_semester !== null
        ? Number(body.current_semester)
        : null;

    // Shadow users won't exist in DB; just echo back
    if (!user_id || String(user_id).startsWith("shadow-")) {
      const profile = {
        ...(auth.user_context?.profile || {}),
        course_id: normalizedCourseId ?? null,
        current_semester: normalizedSemester ?? null,
      };
      return new Response(JSON.stringify({ success: true, profile }), {
        status: 200,
      });
    }

    const updates = {};
    if (normalizedCourseId !== null) updates.course_id = normalizedCourseId;
    if (normalizedSemester !== null) updates.current_semester = normalizedSemester;

    let userRow = null;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user_id)
        .select("*")
        .single();

      if (error) {
        log.error("Failed to update user profile", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 400,
        });
      }
      userRow = data;
    } else {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user_id)
        .single();
      userRow = data;
    }

    // Resolve course_code
    let course_code = body.course_code || auth.user_context?.profile?.course_code || null;
    if (!course_code && userRow?.course_id) {
      const { data: course } = await supabase
        .from("courses")
        .select("course_code")
        .eq("id", userRow.course_id)
        .single();
      course_code = course?.course_code || null;
    }

    // Resolve current_sem_db
    let current_sem_db = auth.user_context?.profile?.current_sem_db || null;
    const semesterNumber = normalizedSemester || userRow?.current_semester;
    if (userRow?.course_id && semesterNumber) {
      const { data: semRow } = await supabase
        .from("semesters")
        .select("id")
        .eq("course_id", userRow.course_id)
        .eq("semester_number", semesterNumber)
        .single();
      current_sem_db = semRow?.id || current_sem_db;
    }

    const profile = {
      ...(auth.user_context?.profile || {}),
      course_id: userRow?.course_id ?? normalizedCourseId ?? null,
      course_code,
      current_semester: semesterNumber ?? null,
      current_sem_db,
    };

    return new Response(JSON.stringify({ success: true, profile }), { status: 200 });
  } catch (err) {
    log.error("Profile completion failed", err);
    return new Response(JSON.stringify({ success: false, error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
