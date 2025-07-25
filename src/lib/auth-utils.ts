import { jwtDecode } from "jwt-decode";

export interface TokenPayload {
  userId: number;
  authId: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  exp: number;
  iat: number;
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Token decode error:", error);
    return true; // Consider invalid tokens as expired
  }
}

export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

export function getTimeUntilExpiration(token: string): number {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp - currentTime;
  } catch (error) {
    console.error("Token decode error:", error);
    return 0;
  }
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Expired";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function shouldAutoLogout(
  token: string,
  warningThreshold: number = 300
): boolean {
  const timeUntilExpiration = getTimeUntilExpiration(token);
  return timeUntilExpiration <= warningThreshold && timeUntilExpiration > 0;
}

export function forceLogout(): void {
  // Clear all auth data
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  // Clear any other auth-related data
  localStorage.removeItem("auth");
  sessionStorage.removeItem("auth");

  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function showExpirationWarning(timeRemaining: number): void {
  if (typeof window !== "undefined") {
    const minutes = Math.ceil(timeRemaining / 60);
    const message = `Your session will expire in ${minutes} minute${
      minutes > 1 ? "s" : ""
    }. Please save your work and log in again.`;

    // Show browser notification if available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Session Expiring", { body: message });
    }

    // Show alert as fallback
    alert(message);
  }
}
