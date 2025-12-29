import { supabase } from "@/lib/supabase";

// GET /api/semesters?course_id=1
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const course_id = searchParams.get("course_id");

  let query = supabase.from("semesters").select("*");
  if (course_id) query = query.eq("course_id", course_id);

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  return new Response(JSON.stringify(data), { status: 200 });
}

// POST /api/semesters
export async function POST(req) {
  const body = await req.json();
  const { course_id, semester_number, title } = body;

  const { data, error } = await supabase.from("semesters")
    .insert({ course_id, semester_number, title })
    .select();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// PUT /api/semesters
export async function PUT(req) {
  const body = await req.json();
  const { id, semester_number, title } = body;

  const { data, error } = await supabase.from("semesters")
    .update({ semester_number, title })
    .eq("id", id)
    .select();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// DELETE /api/semesters
export async function DELETE(req) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabase.from("semesters").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
