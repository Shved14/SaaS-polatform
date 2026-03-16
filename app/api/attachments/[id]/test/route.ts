import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("Test endpoint called for attachment:", params.id);
  
  return NextResponse.json({
    message: "Test endpoint working",
    attachmentId: params.id,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd(),
  });
}
