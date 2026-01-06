import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const storageKey = formData.get("storageKey");
    const unitId = formData.get("unitId");
    const resourceType = formData.get("resourceType");
    const filename = formData.get("filename");
    const linkText = formData.get("linkText");

    if (!file || !storageKey || !unitId || !resourceType || !filename) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase storage using service role
    const { error: uploadError } = await supabase.storage
      .from("nextFileBucket")
      .upload(storageKey, buffer, { upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { success: false, message: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Insert database record
    const { error: dbError } = await supabase
      .from("resources")
      .insert([
        {
          unit_id: unitId,
          resource_type: resourceType,
          filename: filename,
          storage_key: storageKey,
          link_text: linkText,
        },
      ]);

    if (dbError) {
      // Delete uploaded file if DB insert fails
      await supabase.storage
        .from("nextFileBucket")
        .remove([storageKey]);

      return NextResponse.json(
        { success: false, message: `Database insert failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "File uploaded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
