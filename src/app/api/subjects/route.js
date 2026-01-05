import { supabase } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger('subjects_route');

// GET /api/subjects?semester_id=1
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const semester_id = searchParams.get("semester_id");

  let query = supabase.from("subjects").select("id, semester_id, name");
  if (semester_id) query = query.eq("semester_id", semester_id);

  const { data, error } = await query;
  if (error) {
    log.error("Failed to fetch subjects", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}

// POST /api/subjects
export async function POST(req) {
  const body = await req.json();
  const { semester_id, name, shortcode } = body;

  const { data, error } = await supabase.from("subjects")
    .insert({ semester_id, name, shortcode })
    .select();

  try {
    const subject_id = data[0].id;
    for (let i = 1; i < 5; i++) {
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .insert({ subject_id: subject_id, unit_number: i, title: i === 5 ? 'Applicable to All Units' : '' })
        .select();
      
      if (unitError) log.warn(`Failed to create unit ${i}`, unitError);
    }
  } catch (err) {
    log.error(`Error creating units for subject`, err);
  }

  if (error) {
    log.error(`Failed to create subject: ${name}`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Create 'unit-all' for this subject
  const subjectId = data[0].id;
  const { error: unitError } = await supabase.from("units")
    .insert({ subject_id: subjectId, unit_number: "all", title: "Applicable to All Units" })
    .select();

  if (unitError) log.warn(`Failed to create unit-all for subject: ${subjectId}`, unitError);

  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// PUT /api/subjects
export async function PUT(req) {
  const body = await req.json();
  const { id, name, shortcode } = body;

  const { data, error } = await supabase.from("subjects")
    .update({ name, shortcode })
    .eq("id", id)
    .select();

  if (error) {
    log.error(`Failed to update subject: ${id}`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify(data[0]), { status: 200 });
}

// DELETE /api/subjects
export async function DELETE(req) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) {
    log.error(`Failed to delete subject: ${id}`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
