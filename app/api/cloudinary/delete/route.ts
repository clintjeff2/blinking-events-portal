import { NextRequest, NextResponse } from "next/server";
import { deleteFileServer } from "@/lib/cloudinary/server-upload";

export async function POST(request: NextRequest) {
  try {
    const { publicId, resourceType = "image" } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    // Delete the file from Cloudinary using server function
    await deleteFileServer(publicId, resourceType);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
