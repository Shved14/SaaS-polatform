import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Users, Calendar, Mail } from "lucide-react";
import Link from "next/link";

interface InvitePageProps {
    params: {
        workspaceId: string;
        token: string;
    };
}

async function getInvitationDetails(workspaceId: string, token: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invite/${workspaceId}/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching invitation:', error);
        return null;
    }
}

async function acceptInvitation(workspaceId: string, token: string, userId: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invite/${workspaceId}/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userId}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to accept invitation');
        }

        return await response.json();
    } catch (error) {
        console.error('Error accepting invitation:', error);
        throw error;
    }
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { workspaceId, token } = params;
    const session = await getServerSession(authOptions);

    // Get invitation details
    const invitationData = await getInvitationDetails(workspaceId, token);

    if (!invitationData) {
        return (
            <Container className="max-w-md">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <CardTitle>Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is invalid, expired, or has already been used.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/auth/signin">Sign In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    const { invitation } = invitationData;

    // If user is not authenticated, show sign-in prompt
    if (!session?.user?.email) {
        return (
            <Container className="max-w-md">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <CardTitle>You're Invited! 🎉</CardTitle>
                        <CardDescription>
                            You've been invited to join <strong>{invitation.workspaceName}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">Workspace</span>
                            </div>
                            <p className="text-sm font-semibold">{invitation.workspaceName}</p>
                            <p className="text-xs text-muted-foreground">
                                Invited by {invitation.inviterName}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-center text-muted-foreground">
                                Please sign in to accept this invitation
                            </p>
                            <Button asChild className="w-full">
                                <Link href={`/auth/signin?callbackUrl=/invite/${workspaceId}/${token}`}>
                                    Sign In to Accept
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <Link href={`/auth/signup?callbackUrl=/invite/${workspaceId}/${token}`}>
                                    Create Account
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    // Check if the authenticated user's email matches the invitation
    if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        return (
            <Container className="max-w-md">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-8 h-8 text-yellow-600" />
                        </div>
                        <CardTitle>Email Mismatch</CardTitle>
                        <CardDescription>
                            This invitation is for <strong>{invitation.email}</strong>, but you're signed in as <strong>{session.user.email}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Please sign out and sign in with the correct email address, or contact the person who invited you.
                        </p>
                        <div className="space-y-2">
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/auth/signout">Sign Out</Link>
                            </Button>
                            <Button asChild className="w-full">
                                <Link href="/app/dashboard">Go to Dashboard</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    // Try to accept the invitation
    try {
        const userId = (session.user as any).id;
        await acceptInvitation(workspaceId, token, userId);

        return (
            <Container className="max-w-md">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle>Invitation Accepted! ✅</CardTitle>
                        <CardDescription>
                            You've successfully joined <strong>{invitation.workspaceName}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">Workspace</span>
                            </div>
                            <p className="text-sm font-semibold">{invitation.workspaceName}</p>
                        </div>

                        <Button asChild className="w-full">
                            <Link href={`/app/workspace/${workspaceId}`}>
                                Go to Workspace
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        );
    } catch (error) {
        return (
            <Container className="max-w-md">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <CardTitle>Error Accepting Invitation</CardTitle>
                        <CardDescription>
                            {error instanceof Error ? error.message : 'An unexpected error occurred'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/app/dashboard">Go to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        );
    }
}