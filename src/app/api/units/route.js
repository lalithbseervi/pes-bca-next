import { supabase } from "@/lib/supabase";

// GET /api/units?subject_id=1
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get("subject_id");

  let query = supabase.from("units").select("*");
  if (subject_id) query = query.eq("subject_id", subject_id);

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  return new Response(JSON.stringify(data), { status: 200 });
}

// POST /api/units
export async function POST(req) {
  const body = await req.json();
  const { subject_id, unit_number, title } = body;

  const { data, error } = await supabase.from("units")
    .insert({ subject_id, unit_number, title })
    .select();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// PUT /api/units
export async function PUT(req) {
  const body = await req.json();
  const { id, unit_number, title } = body;

  const { data, error } = await supabase.from("units")
    .update({ unit_number, title })
    .eq("id", id)
    .select();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// DELETE /api/units
export async function DELETE(req) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
