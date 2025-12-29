import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("resources")
    .upsert(body)
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data[0]), { status: 200 });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const unit_id = searchParams.get("unit_id");
  const storage_key = searchParams.get("file");
  const subject_id = searchParams.get("subject_id");
  const resource_type = searchParams.get("resource_type");

  let query = supabase
    .from("resources")
    .select(`
      *,
      units!inner(unit_number, title, subject_id, subjects(name))
    `);

  if (unit_id) query = query.eq("unit_id", unit_id);
  if (storage_key) query = query.eq("storage_key", storage_key);
  if (subject_id) query = query.eq("units.subject_id", subject_id);
  if (resource_type) query = query.eq("resource_type", resource_type);

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  // Flatten the nested structure for easier access
  const flattenedData = data.map((resource) => ({
    ...resource,
    unit_number: resource.units?.unit_number,
    unit_title: resource.units?.title,
    subject_id: resource.units?.subject_id,
    subject_name: resource.units?.subjects?.name,
  }));

  return new Response(JSON.stringify(flattenedData), { status: 200 });
}
