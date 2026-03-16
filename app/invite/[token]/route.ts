import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=invalid_token", request.url)
      );
    }

    // Find the invitation by token
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        token,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=invitation_not_found", request.url)
      );
    }

    // Redirect to sign-in page with invitation info
    const redirectUrl = new URL("/auth/signin", request.url);
    redirectUrl.searchParams.set("invitation_token", token);
    redirectUrl.searchParams.set("email", invitation.email);
    redirectUrl.searchParams.set("workspace_name", invitation.workspace.name);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling invitation:", error);
    return NextResponse.redirect(
      new URL("/auth/signin?error=server_error", request.url)
    );
  }
}
