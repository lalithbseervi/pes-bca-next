import { supabase } from "@/lib/supabase";

// GET /api/courses
export async function GET(req) {
  const { data, error } = await supabase.from("courses").select("*");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
}

// POST /api/courses
export async function POST(req) {
  const body = await req.json();
  const { course_code, course_name } = body;

  const { data, error } = await supabase.from("courses").insert({ course_code, course_name }).select();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  try {
    const course_id = data[0].id;
    for (let i = 1; i < 7; i++) {
      const title = `Semester-${i}`;
      const { data: semData, error: semError } = await supabase
        .from("semesters")
        .insert({ course_id, semester_number: i, title })
        .select();
    }
  } catch (err) {
    console.error(err);
  }

  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// PUT /api/courses
export async function PUT(req) {
  const body = await req.json();
  const { id, course_code, course_name } = body;

  const { data, error } = await supabase.from("courses").update({ course_code, course_name }).eq("id", id).select();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// DELETE /api/courses
export async function DELETE(req) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}