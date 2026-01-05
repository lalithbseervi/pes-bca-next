import { supabase } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger('resources_navigation_route');

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    log.warn("Navigation request missing resource ID");
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
      log.warn(`Resource not found: ${id}`);
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
    log.error("Navigation fetch failed", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
