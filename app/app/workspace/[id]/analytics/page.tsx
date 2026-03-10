import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface WorkspaceAnalyticsPageProps {
  params: { id: string };
}

export default async function WorkspaceAnalyticsPage({
  params
}: WorkspaceAnalyticsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      members: {
        select: { userId: true }
      }
    }
  });

  if (!workspace) {
    notFound();
  }

  const isOwner = workspace.ownerId === userId;
  const isMember =
    isOwner || workspace.members.some((m) => m.userId === userId);

  if (!isMember) {
    redirect("/app/dashboard");
  }

  return (
    <Container className="space-y-8 py-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/app/workspace/${workspace.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Назад к workspace</span>
        </Link>
      </header>
      <AnalyticsDashboard workspaceId={workspace.id} />
    </Container>
  );
}

