import { NextResponse } from "next/server";
import { sendWorkspaceInvitationEmail } from "@/lib/email";

export async function POST() {
  try {
    const result = await sendWorkspaceInvitationEmail({
      to: "test@example.com",
      workspaceName: "Test Workspace",
      inviterName: "Test User",
      inviterEmail: "test@saas-platform.ru",
      invitationToken: "test-token-123",
      workspaceId: "test-workspace-id",
      isNewUser: false,
    });

    console.log('Test email result:', result);

    return NextResponse.json({ 
      success: result.ok,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
