import { makeCookie } from "@/lib/cookies.js";
import { signJWT, verifyJWT } from "@/lib/sign_jwt.js";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/auth_helpers";

const ACCESS_TTL = 24 * 60 * 60; // 24h
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7d
const JSON_HEADERS = { "Content-Type": "application/json" };

const now = () => Date.now();
const isExpired = (iso) => new Date(iso).getTime() <= now();

function respondWithCookies(access, refresh, request, sessionObj) {
  const headers = new Headers(JSON_HEADERS);

  headers.append(
    "Set-Cookie",
    makeCookie("access_token", access, ACCESS_TTL, request)
  );
  headers.append(
    "Set-Cookie",
    makeCookie("refresh_token", refresh, REFRESH_TTL, request)
  );

  return new Response(
    JSON.stringify({
      success: true,
      session: sessionObj,
    }),
    { status: 200, headers }
  );
}

function resolveSemesterFromUsername(username) {
  const match = username.match(/^PES[1-2]UG(\d{2})[A-Z]{2}\d{3}$/i);
  if (!match) return 1; // default semester 1

  const admissionYear = 2000 + Number(match[1]);
  const currentDate = new Date();
  let yearsElapsed = currentDate.getFullYear() - admissionYear;
  if (currentDate.getMonth() < 6) yearsElapsed -= 1;

  const semester = yearsElapsed * 2 + 1;
  return semester > 0 ? semester : 1;
}

async function resolveCourseId({ username, profile }) {
  const match = username.match(/^PES[1-2]UG\d{2}([A-Z]{2})\d{3}$/i);

  if (match) {
    const code = match[1].toUpperCase();
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("course_code", code)
      .single();
    if (course) return course.id;
  }

  if (profile?.program) {
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("course_name", profile.program)
      .single();
    if (course) return course.id;
  }

  throw new Error("Unable to resolve course_id");
}

export async function POST(request) {
  const { username, password } = await request.json();

  const deviceId = await getDeviceId(
    username,
    request.headers.get("user-agent")
  );

  // Fetch user
  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("college_id", username)
    .single();

  // Fetch session for this user + device
  let { data: session } = user
    ? await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("device_id", deviceId)
        .single()
    : { data: null };

  // If session exists, check for access and refresh tokens
  if (session) {
    const accessExpired =
      !session.access_token || isExpired(session.expires_at);
    const refreshExpired =
      !session.refresh_token ||
      new Date(session.last_refreshed).getTime() + REFRESH_TTL * 1000 <=
        Date.now();

    let accessToken = session.access_token;
    let refreshToken = session.refresh_token;
    
    // Decode the access token to get the profile
    let sessionProfile;
    try {
      const decoded = await verifyJWT(accessToken, process.env.JWT_SECRET);
      if (decoded.valid) {
        sessionProfile = decoded.payload.profile;
      } else {
        console.error("Failed to verify access token:", decoded.reason);
        sessionProfile = { user_id: user.id, course_id: user.course_id };
      }
    } catch (error) {
      console.error("Failed to decode access token:", error);
      sessionProfile = { user_id: user.id, course_id: user.course_id };
    }

    // Both tokens missing or expired, then regenerate locally using session profile
    if (accessExpired && refreshExpired) {
      accessToken = await signJWT(
        { sub: user.id, type: "access", profile: sessionProfile },
        process.env.JWT_SECRET,
        ACCESS_TTL
      );
      refreshToken = await signJWT(
        { sub: user.id, type: "refresh", profile: sessionProfile },
        process.env.JWT_SECRET,
        REFRESH_TTL
      );

      await supabase
        .from("sessions")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + ACCESS_TTL * 1000).toISOString(),
          last_refreshed: new Date().toISOString(),
        })
        .eq("id", session.id);
    }

    // Access expired but refresh still valid, then only refresh access token
    else if (accessExpired && !refreshExpired) {
      accessToken = await signJWT(
        { sub: user.id, type: "access", profile: sessionProfile },
        process.env.JWT_SECRET,
        ACCESS_TTL
      );

      await supabase
        .from("sessions")
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + ACCESS_TTL * 1000).toISOString(),
          last_refreshed: new Date().toISOString(),
        })
        .eq("id", session.id);
    }

    // Update last login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    sessionProfile.current_semester = resolveSemesterFromUsername(username)

    const { data: sem_id } = await supabase
      .from("semesters")
      .select("id")
      .eq("course_id", sessionProfile.course_id)
      .eq("semester_number", sessionProfile.current_semester)
      .single()

    sessionProfile.current_sem_db = sem_id["id"]

    return respondWithCookies(accessToken, refreshToken, request, sessionProfile);
  }

  // No session exists for this device, then hit auth API
  const authResp = await fetch("http://localhost:5000/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, profile: true }),
  });

  if (!authResp.ok) {
    return new Response(
      JSON.stringify({ success: false, message: "invalid credentials" }),
      { status: 401, headers: JSON_HEADERS }
    );
  }

  const { profile } = await authResp.json();

  let course_id = null;
  let current_semester = null;
  // Create user if not exists
  if (!user) {
    course_id = await resolveCourseId({ username, profile });
    current_semester = profile.semester[profile.semester.length - 1];

    const { data: newUser } = await supabase
      .from("users")
      .insert({
        college_id: username,
        course_id: course_id,
        current_semester: current_semester,
        created_at: new Date(Date.now()).toISOString(),
        last_login: new Date(Date.now()).toISOString(),
      })
      .select("*")
      .single();

    user = newUser;
  } else {
    course_id = user.course_id;
  }

  let course_code = profile.srn.match(/^PES[1-2]UG\d{2}([A-Z]{2})\d{3}$/i)[1];
  profile.course_code = course_code
  profile.current_semester = current_semester

  // Build session profile with all necessary fields
  const sessionProfile = {
    ...profile,
    course_id: course_id,
    user_id: user.id,
  };

  // Create session for this device
  const accessToken = await signJWT(
    { sub: user.id, type: "access", profile: sessionProfile },
    process.env.JWT_SECRET,
    ACCESS_TTL
  );

  const refreshToken = await signJWT(
    { sub: user.id, type: "refresh", profile: sessionProfile },
    process.env.JWT_SECRET,
    REFRESH_TTL
  );

  const { data: newSession, error: newSessionCreateErr } = await supabase
    .from("sessions")
    .upsert(
      {
        user_id: user.id,
        device_id: deviceId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + ACCESS_TTL * 1000).toISOString(),
        last_refreshed: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: ["user_id", "device_id"] }
    )
    .select("*")
    .single();
  
  if (newSessionCreateErr) console.error(newSessionCreateErr);

  return respondWithCookies(accessToken, refreshToken, request, sessionProfile);
}
