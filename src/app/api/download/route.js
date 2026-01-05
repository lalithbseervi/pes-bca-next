import { supabase } from "@/lib/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger('download_route');

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("file");
  const view_file = searchParams.get("view_file");

  if (!key && !view_file) {
    log.warn("Download request missing storage key");
    return new Response(JSON.stringify({ error: "Missing storage key" }), {
      status: 400,
    });
  }

  const fileToGet = key || view_file;
  try {
    const { data, error } = await supabase.storage
      .from("nextFileBucket")
      .download(fileToGet);

    if (error) {
      log.error(`Failed to download file: ${fileToGet}`, error);
      return new Response(error, { status: 404 });
    }

    // Return the file with appropriate headers
    if (view_file) {
      return new Response(data, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${fileToGet
            .split("/")
            .pop()}"`,
          "X-Frame-Options": "SAMEORIGIN",
        },
      });
    } else if (key) {
      return new Response(data, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attatchment; filename="${fileToGet
            .split("/")
            .pop()}"`,
        },
      });
    }
  } catch (err) {
    log.error(`Download error: ${err.message}`, err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
}
