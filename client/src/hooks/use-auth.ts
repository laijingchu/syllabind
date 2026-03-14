import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 10, // revalidate session every 10 min
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onMutate: () => {
      setIsLoggingOut(true);
    },
    onSuccess: () => {
      // Set user to null but keep the query entry so isLoading stays false
      // (avoids Router flashing a spinner and killing the "Come back soon!" overlay).
      queryClient.setQueryData(["/api/auth/me"], null);
      // Remove stale data (enrollments, binders, etc.) but preserve the auth query.
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "/api/auth/me",
      });
      setTimeout(() => {
        setIsLoggingOut(false);
        setLocation("/welcome");
      }, 800);
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
