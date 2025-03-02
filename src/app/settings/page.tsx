"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deleteUser } from "@/lib/api";

export default function SettingsPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Debug information
  useEffect(() => {
    console.log("Settings page loaded");
    console.log("Auth state:", { user, loading, error });
  }, [user, loading, error]);

  // Handle user deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        setIsDeleting(true);
        await deleteUser();
        toast.success("Your account has been deleted");
        router.push("/");
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Loading your account information...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription className="text-red-500">
              Error loading your account: {error.message}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show content when user is available
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={user?.name || ""} disabled />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
