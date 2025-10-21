import { NextRequest, NextResponse } from "next/server";
import { uploadFileServer } from "@/lib/cloudinary/server-upload";
import { validateFileSize, getFileType } from "@/lib/cloudinary/config";

export async function POST(request: NextRequest) {
  try {
    console.log("[API Cloudinary] ========== NEW UPLOAD REQUEST ==========");
    console.log("[API Cloudinary] Received upload request");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const publicId = formData.get("publicId") as string | null;

    console.log("[API Cloudinary] File:", file?.name, file?.type, file?.size);
    console.log("[API Cloudinary] Folder:", folder);
    console.log("[API Cloudinary] Public ID:", publicId);

    if (!file) {
      console.error("[API Cloudinary] ❌ No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    console.log("[API Cloudinary] Converting file to buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(
      "[API Cloudinary] Buffer created, size:",
      buffer.length,
      "bytes"
    );

    // Validate file size
    console.log("[API Cloudinary] Validating file...");
    const fileType = getFileType(file);
    console.log("[API Cloudinary] File type detected:", fileType);
    const validation = validateFileSize(file, fileType);

    if (!validation.isValid) {
      console.error("[API Cloudinary] ❌ Validation failed:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    console.log("[API Cloudinary] ✓ File validation passed");

    console.log("[API Cloudinary] Preparing for Cloudinary upload...");

    // Get file extension from filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    console.log("[API Cloudinary] File extension:", fileExtension);

    // Upload to Cloudinary using server function
    const result = await uploadFileServer(
      buffer,
      folder || "blinking-events/temp",
      {
        publicId: publicId || undefined,
        resourceType: "auto" as any,
        format: fileExtension,
      }
    );

    console.log("[API Cloudinary] ✓ Upload successful:", result.url);
    console.log("[API Cloudinary] ========== UPLOAD COMPLETE ==========");
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("[API Cloudinary] ========== UPLOAD FAILED ==========");
    console.error("[API Cloudinary] ❌ Upload error:", error);
    console.error("[API Cloudinary] Error message:", error.message);
    console.error("[API Cloudinary] Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
