import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  createWorkspaceAction,
  deleteWorkspaceAction
} from "@/actions/workspace";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkspaceList } from "@/components/workspace/WorkspaceList";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FolderOpen,
  Users,
  Crown,
  Trash2,
  AlertTriangle,
  LayoutDashboard
} from "lucide-react";

interface DashboardPageProps {
  searchParams?: { error?: string };
}

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const errorParam = searchParams?.error;

  const [user, workspaces, ownedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, proUntil: true }
    }),
    prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: true,
        _count: {
          select: {
            members: true,
            boards: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    }),
    prisma.workspace.count({
      where: { ownerId: userId }
    })
  ]);

  const now = new Date();
  const isProActive =
    user &&
    user.plan === "PRO" &&
    (user.proUntil == null || user.proUntil > now);
  const workspacesLimit = isProActive ? null : 3;
  const reachedLimit =
    workspacesLimit != null && ownedCount >= workspacesLimit;

  return (
    <Container className="py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Workspaces
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your workspaces and boards
            </p>
          </div>
        </div>
        <form action={createWorkspaceAction} className="flex gap-2">
          <Input
            type="text"
            name="name"
            placeholder="Workspace name"
            className="h-10 w-64"
            required
            disabled={reachedLimit}
          />
          <Button type="submit" size="sm" disabled={reachedLimit} className="gap-2">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </form>
      </header>

      {/* Error Message */}
      {errorParam === "workspace_limit" && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Workspace limit reached
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  On the free plan, you can create up to
                  <span className="font-semibold"> {workspacesLimit} </span>
                  workspaces. Delete one or upgrade to Pro.
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workspaces Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <WorkspaceList
          workspaces={workspaces}
          userId={userId}
        />
      </section>

      {workspaces.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Create your first workspace to start organizing your projects and collaborating with your team.
            </p>
            <Button asChild className="gap-2">
              <Link href="#create-workspace">
                <Plus className="h-4 w-4" />
                Create Workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

