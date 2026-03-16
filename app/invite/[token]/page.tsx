"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Invitation not found");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setInvitation(data);
    } catch (err) {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!session) {
      // Redirect to login with callback
      router.push(`/auth/signin?callbackUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invitation");
        return;
      }

      setSuccess("Invitation accepted successfully!");

      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        router.push(data.redirectUrl || `/app/workspace/${data.workspaceId}`);
      }, 2000);
    } catch (err) {
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!session) return;

    setRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "DELETE",
      });

      const data = await response.json();
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader >
    <CardContent>
      <Button
        onClick={() => router.push("/app")}
        className="w-full"
      >
        Go to Dashboard
      </Button>
    </CardContent>
        </Card >
      </div >
    );
}

if (success) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Success!</CardTitle>
          <CardDescription>{success}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center">
            You will be redirected automatically...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Workspace Invitation</CardTitle>
        <CardDescription>
          You've been invited to join a workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold">{invitation?.workspaceName}</h3>
          <p className="text-sm text-gray-600">
            Invited by {invitation?.inviterName} ({invitation?.inviterEmail})
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Invitation expires: {new Date(invitation?.expiresAt).toLocaleDateString()}
          </p>
        </div>

        {!session && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please sign in to accept this invitation
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={accepting || rejecting}
            className="flex-1"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting...
              </>
            ) : (
              "Accept"
            )}
          </Button>

          {session && (
            <Button
              onClick={handleReject}
              disabled={accepting || rejecting}
              variant="outline"
              className="flex-1"
            >
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={() => router.push("/app")}
          className="w-full"
        >
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  </div>
);
}
