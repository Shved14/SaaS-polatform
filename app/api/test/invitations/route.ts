import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Invitations API is working",
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd(),
  });
}

export async function POST() {
  return NextResponse.json({
    message: "Invitations POST API is working",
    timestamp: new Date().toISOString(),
  });
}
