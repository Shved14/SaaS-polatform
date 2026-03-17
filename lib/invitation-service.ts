import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type InvitationStatus = "pending" | "accepted" | "expired";

export const InvitationService = {
  async createInvitation(
    workspaceId: string,
    email: string,
    inviterId: string
  ) {
    try {
      // Генерируем уникальный токен
      const token = crypto.randomBytes(32).toString('hex');

      const invitation = await prisma.workspaceInvitation.create({
        data: {
          workspaceId,
          email,
          inviterId,
          token,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
        }
      });

      return invitation;
    } catch (error) {
      console.error("Failed to create invitation:", error);
      throw error("Failed to create invitation");
    }
  },

  async getInvitationByToken(token: string) {
    try {
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: { token },
        include: {
          workspace: {
            select: {
              id: true,
              name: true
            }
          },
          inviter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return invitation;
    } catch (error) {
      console.error("Failed to get invitation:", error);
      return null;
    }
  },

  async acceptInvitation(token: string, userId: string) {
    try {
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: { token }
      });

      if (!invitation) {
        throw new Error("Invitation not found");
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error("Invitation expired");
      }

      if (invitation.status !== "pending") {
        throw new Error("Invitation already processed");
      }

      // Обновляем статус приглашения
      const updatedInvitation = await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "accepted"
        }
      });

      // Добавляем пользователя в workspace
      await prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: "MEMBER"
        }
      });

      // Логируем действие
      await prisma.activity.create({
        data: {
          userId: invitation.inviterId,
          action: "joined_workspace",
          entityId: invitation.workspaceId,
          entityType: "workspace",
          details: {
            invitedUser: userId,
            workspaceName: invitation.workspace?.name || ""
          },
          metadata: {
            invitationToken: token,
            invitedEmail: invitation.email
          }
        }
      });

      return updatedInvitation;
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      throw error("Failed to accept invitation");
    }
  },

  async getInvitationsForWorkspace(workspaceId: string) {
    try {
      const invitations = await prisma.workspaceInvitation.findMany({
        where: {
          workspaceId,
          status: "pending"
        },
        include: {
          inviter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return invitations;
    } catch (error) {
      console.error("Failed to get invitations:", error);
      return [];
    }
  },

  async cleanupExpiredInvitations() {
    try {
      const result = await prisma.workspaceInvitation.updateMany({
        where: {
          status: "pending",
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          status: "expired"
        }
      });

      console.log(`Cleaned up ${result.count} expired invitations`);
      return result.count;
    } catch (error) {
      console.error("Failed to cleanup expired invitations:", error);
      return 0;
    }
  },

  async deleteInvitation(invitationId: string, userId: string) {
    try {
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: { id: invitationId }
      });

      if (!invitation) {
        throw new Error("Invitation not found");
      }

      if (invitation.inviterId !== userId) {
        throw new Error("Only inviter can delete invitation");
      }

      await prisma.workspaceInvitation.delete({
        where: { id: invitationId }
      });

      // Логируем удаление
      await prisma.activity.create({
        data: {
          userId,
          action: "deleted_board",
          entityId: invitation.workspaceId,
          entityType: "workspace",
          details: {
            workspaceName: invitation.workspace?.name || "",
            deletedBy: userId
          }
        }
      });

      return true;
    } catch (error) {
      console.error("Failed to delete invitation:", error);
      throw error("Failed to delete invitation");
    }
  }
};
