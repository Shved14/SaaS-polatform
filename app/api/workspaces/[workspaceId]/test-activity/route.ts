import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";
import { ActivityService } from "@/lib/activity-service";

export const POST = createApiHandler(
  async (_req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

    console.log("Testing activity system...");

    try {
      // Тестируем запись активности
      await ActivityService.logActivity(userId, "created_task", "test-task-id", "task", {
        newValue: { title: "Test Task Activity" }
      });

      // Проверяем, что активность записалась
      const activities = await prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      console.log("Activities found:", activities.length);

      return NextResponse.json({
        success: true,
        message: "Activity test completed",
        activitiesCount: activities.length,
        latestActivity: activities[0]
      });
    } catch (error) {
      console.error("Activity test failed:", error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 });
    }
  }
);
