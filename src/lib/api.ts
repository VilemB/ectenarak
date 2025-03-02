/**
 * API utility functions for making requests to the backend
 */

/**
 * Delete the current user's account
 * @returns Promise that resolves when the account is deleted
 */
export async function deleteUser(): Promise<void> {
  const response = await fetch("/api/user/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete account");
  }

  return;
}
