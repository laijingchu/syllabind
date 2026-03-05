import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchUser(): Promise<User | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const response = await fetch("/api/auth/me", {
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function useAuth() {
  // Separate state so the loading overlay persists through the full page
  // navigation. useMutation's isPending resets to false as soon as onSuccess
  // fires, but window.location.href still needs time to load the new page.
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onMutate: () => {
      setIsLoggingOut(true);
    },
    onSuccess: () => {
      // Keep isLoggingOut true — the full page reload will unmount everything.
      window.location.href = "/welcome";
    },
    onError: () => {
      setIsLoggingOut(false);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut,
  };
}
