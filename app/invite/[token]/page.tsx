import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InvitePageProps {
  params: { token: string };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const callback = encodeURIComponent(`/invite/${params.token}`);
    redirect(`/auth/signin?callbackUrl=${callback}`);
  }

  const userId = session.user.id;

  const invite = await prisma.inviteLink.findUnique({
    where: { token: params.token },
    include: {
      workspace: {
        include: {
          owner: true
        }
      }
    }
  });

  if (!invite || invite.expiresAt < new Date()) {
    return (
      <Container className="py-16">
        <div className="max-w-md rounded-lg border bg-card p-6 text-sm">
          <h1 className="text-lg font-semibold">Ссылка недействительна</h1>
          <p className="mt-2 text-muted-foreground">
            Приглашение по этой ссылке не найдено или истекло. Попросите
            владельца workspace отправить вам новую ссылку.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/app/dashboard">На дашборд</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: invite.workspaceId
      }
    }
  });

  if (!existingMember) {
    await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: invite.workspaceId,
        role: "MEMBER"
      }
    });
  }

  redirect(`/app/workspace/${invite.workspaceId}`);
}

