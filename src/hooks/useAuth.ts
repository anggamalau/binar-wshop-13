"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Memoized token validation function
  const validateToken = useCallback((token: string): User | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        localStorage.removeItem("token");
        return null;
      }

      return {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        fullName: payload.fullName,
      };
    } catch (error) {
      console.error("Token decode error:", error);
      localStorage.removeItem("token");
      return null;
    }
  }, []);

  // Memoized auth check to prevent unnecessary re-computations
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const userData = validateToken(token);
      setUser(userData);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [validateToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((token: string, userData: any) => {
    localStorage.setItem("token", token);
    setUser({
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  }, [router]);

  const requireAuth = useCallback(
    (redirectTo = "/login") => {
      if (!loading && !user) {
        router.push(redirectTo);
        return false;
      }
      return true;
    },
    [loading, user, router]
  );

  const requireGuest = useCallback(
    (redirectTo = "/users") => {
      if (!loading && user) {
        router.push(redirectTo);
        return false;
      }
      return true;
    },
    [loading, user, router]
  );

  // Memoized return value to prevent unnecessary re-renders
  const authValue = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      requireAuth,
      requireGuest,
    }),
    [user, loading, login, logout, requireAuth, requireGuest]
  );

  return authValue;
}
