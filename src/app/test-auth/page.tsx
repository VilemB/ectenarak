"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TestAuthPage() {
  const { user, loading, sessionStatus } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    console.log("Test Auth Page mounted");
    console.log("User:", user);
    console.log("Loading:", loading);
    console.log("Session status:", sessionStatus);

    setDebugInfo(`
      User: ${user ? JSON.stringify(user) : "null"}, 
      Loading: ${loading}, 
      Session status: ${sessionStatus}
    `);
  }, [user, loading, sessionStatus]);

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Test Authentication</h1>

      <div className="p-4 bg-gray-800 rounded mb-6">
        <h2 className="text-xl mb-2">Debug Info:</h2>
        <pre className="whitespace-pre-wrap text-xs text-gray-300">
          {debugInfo}
        </pre>
      </div>

      <div className="grid gap-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <h2 className="text-lg font-medium mb-2">Authentication Status</h2>
          {loading ? (
            <p>Loading authentication status...</p>
          ) : user ? (
            <div>
              <p className="text-green-500">✓ Authenticated</p>
              <p>User ID: {user.id}</p>
              <p>Name: {user.name}</p>
              <p>Email: {user.email}</p>
            </div>
          ) : (
            <p className="text-red-500">✗ Not authenticated</p>
          )}
        </div>

        <div className="flex gap-4">
          <Button onClick={() => router.push("/")}>Go to Home</Button>
          <Button onClick={() => router.push("/settings")}>
            Go to Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
