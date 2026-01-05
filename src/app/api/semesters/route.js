import { supabase } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger('semesters_route');

// GET /api/semesters?course_id=1
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const course_id = searchParams.get("course_id");

  let query = supabase.from("semesters").select(`id, course_id, semester_number, title`);
  if (course_id) query = query.eq("course_id", course_id);

  const { data, error } = await query;
  if (error) {
    log.error("Failed to fetch semesters", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}

// POST /api/semesters
export async function POST(req) {
  const body = await req.json();
  const { course_id, semester_number, title } = body;

  const { data, error } = await supabase.from("semesters")
    .insert({ course_id, semester_number, title })
    .select();

  if (error) {
    log.error(`Failed to create semester: course=${course_id}`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
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

  if (error) {
    log.error(`Failed to update semester: ${id}`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// DELETE /api/semesters
export async function DELETE(req) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabase.from("semesters").delete().eq("id", id);
  if (error) {
    log.error(`Failed to delete semester: ${id}`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
