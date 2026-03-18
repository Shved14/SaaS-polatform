-- AlterTable: Add missing columns to Notification
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Notification" ALTER COLUMN "data" DROP NOT NULL;

-- CreateTable: NotificationSettings
CREATE TABLE IF NOT EXISTS "NotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taskAssigned" BOOLEAN NOT NULL DEFAULT true,
    "taskComment" BOOLEAN NOT NULL DEFAULT true,
    "taskDeadlineToday" BOOLEAN NOT NULL DEFAULT true,
    "taskOverdue" BOOLEAN NOT NULL DEFAULT true,
    "workspaceInvitation" BOOLEAN NOT NULL DEFAULT true,
    "taskCreated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationSettings_userId_idx" ON "NotificationSettings"("userId");

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: WorkspaceIntegration
CREATE TABLE IF NOT EXISTS "WorkspaceIntegration" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceIntegration_workspaceId_type_key" ON "WorkspaceIntegration"("workspaceId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkspaceIntegration_workspaceId_idx" ON "WorkspaceIntegration"("workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceIntegration" ADD CONSTRAINT "WorkspaceIntegration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Activity
CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "details" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_entityId_idx" ON "Activity"("entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_entityType_idx" ON "Activity"("entityType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_action_idx" ON "Activity"("action");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix Task boardId FK: change from RESTRICT to CASCADE for workspace deletion to work
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_boardId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix WorkspaceInvitation: add default for expiresAt if missing
ALTER TABLE "WorkspaceInvitation" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '7 days');
