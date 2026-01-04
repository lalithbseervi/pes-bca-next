import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function getDeviceId(username, userAgent) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username + "::" + userAgent);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export function resolveSemesterFromUsername(username) {
  const match = username.match(/^PES[1-2]UG(\d{2})[A-Z]{2}\d{3}$/i);
  if (!match) return 1; // default semester 1

  const admissionYear = 2000 + Number(match[1]);
  const currentDate = new Date();
  let yearsElapsed = currentDate.getFullYear() - admissionYear;
  if (currentDate.getMonth() < 6) yearsElapsed -= 1;

  const semester = yearsElapsed * 2 + 1;
  return semester > 0 ? semester : 1;
}

export async function resolveCourseId({ username, profile }) {
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

  throw new Error(
    `course_id couldn't be resolved for program ${profile?.program} and username ${username}`
  );
}
