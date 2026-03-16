"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyInvitePage() {
  const { workspaceId, token } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to new format
    if (token) {
      router.replace(`/invite/${token}`);
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
