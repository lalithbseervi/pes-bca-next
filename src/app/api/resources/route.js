import { supabase } from "@/lib/supabase";
import { generateETag } from "@/lib/etag";
import { createLogger } from "@/lib/logger";

const log = createLogger("resources_route");

export async function POST(req) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("resources")
    .upsert(body)
    .select();

  if (error) {
    log.error("Failed to upsert resource", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify(data[0]), { status: 200 });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const unit_id = searchParams.get("unit_id");
  const storage_key = searchParams.get("file");
  const subject_id = searchParams.get("subject_id");
  const resource_type = searchParams.get("resource_type");
  const include_id = searchParams.get("include_id") === "true";

  let query;
  if (include_id) {
    query = supabase.from("resources").select(`
      *,
      units!inner(unit_number, title, subject_id, subjects(name))
    `);
  } else {
    query = supabase.from("resources").select(`
      id, unit_id, resource_type, filename, storage_key, link_text,
      units!inner(subject_id)
    `);
  }
  
  if (unit_id) query = query.eq("unit_id", unit_id);
  if (storage_key) query = query.eq("storage_key", storage_key);
  if (subject_id) query = query.eq("units.subject_id", subject_id);
  if (resource_type) query = query.eq("resource_type", resource_type);

  const { data, error } = await query;
  if (error) {
    log.error("Failed to fetch resources", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  const jsonData = JSON.stringify(data);
  const etag = generateETag(jsonData);

  const ifNoneMatch = req.headers.get("If-None-Match");

  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
      },
    });
  }

  // Flatten the nested structure for easier access
  // const flattenedData = data.map((resource) => ({
  //   ...resource,
  //   unit_number: resource.units?.unit_number,
  //   unit_title: resource.units?.title,
  //   subject_id: resource.units?.subject_id,
  //   subject_name: resource.units?.subjects?.name,
  // }));
  // 5-34% savings in network requests after not implementing flattenedData

  const flattenedData = data.map((resource) => ({
    ...(include_id && {
      id: resource.id,
      unit_number: resource.units?.unit_number,
      unit_title: resource.units?.title,
      subject_id: resource.units?.subject_id,
      subject_name: resource.units?.subjects?.name,
    }),
    unit_id: resource.unit_id,
    resource_type: resource.resource_type,
    filename: resource.filename,
    storage_key: resource.storage_key,
    link_text: resource.link_text,
  }));

  return new Response(JSON.stringify(flattenedData), {
    status: 200,
    headers: { ETag: etag, "Cache-Control": "private, max-age=86400" },
  });
  // return new Response(JSON.stringify(data), { status: 200, headers: { 'ETag': etag, 'Cache-Control': 'private, max-age=86400' } });
}
