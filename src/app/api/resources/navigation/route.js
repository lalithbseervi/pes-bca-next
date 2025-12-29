import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing resource ID" }), {
      status: 400,
    });
  }

  try {
    // Get current resource to find its unit
    const { data: current } = await supabase
      .from("resources")
      .select("id, unit_id")
      .eq("id", id)
      .single();

    if (!current) {
      return new Response(JSON.stringify({ error: "Resource not found" }), {
        status: 404,
      });
    }

    // Get all resources in same unit, ordered by ID
    const { data: allResources } = await supabase
      .from("resources")
      .select("id, storage_key, link_text")
      .eq("unit_id", current.unit_id)
      .order("id", { ascending: true });

    // Find current index and determine prev/next
    const currentIndex = allResources.findIndex((r) => r.id === current.id);
    
    const navigation = {
      prev: currentIndex > 0 ? allResources[currentIndex - 1] : null,
      next: currentIndex < allResources.length - 1 ? allResources[currentIndex + 1] : null,
    };

    return new Response(JSON.stringify(navigation), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
