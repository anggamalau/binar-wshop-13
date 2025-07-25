import { useEffect, useRef, useState } from "react";
import {
  isTokenExpired,
  getTimeUntilExpiration,
  formatTimeRemaining,
  shouldAutoLogout,
  forceLogout,
  showExpirationWarning,
} from "@/lib/auth-utils";

interface UseTokenExpirationOptions {
  warningThreshold?: number; // seconds before expiration to show warning
  checkInterval?: number; // milliseconds between checks
  autoLogout?: boolean; // whether to automatically logout on expiration
  showWarning?: boolean; // whether to show expiration warnings
}

export function useTokenExpiration(options: UseTokenExpirationOptions = {}) {
  const {
    warningThreshold = 300, // 5 minutes
    checkInterval = 10000, // 10 seconds
    autoLogout = true,
    showWarning = true,
  } = options;

  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const checkTokenExpiration = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      setIsExpired(true);
      setTimeRemaining("No token");
      return;
    }

    const expired = isTokenExpired(token);
    setIsExpired(expired);

    if (expired) {
      setTimeRemaining("Expired");
      if (autoLogout) {
        console.log("Token expired, forcing logout...");
        forceLogout();
      }
      return;
    }

    const secondsRemaining = getTimeUntilExpiration(token);
    const formattedTime = formatTimeRemaining(secondsRemaining);
    setTimeRemaining(formattedTime);

    // Check if we should show warning
    if (shouldAutoLogout(token, warningThreshold) && !warningShownRef.current) {
      warningShownRef.current = true;
      setShowWarningModal(true);

      if (showWarning) {
        showExpirationWarning(secondsRemaining);
      }
    }

    // Auto logout when expired
    if (secondsRemaining <= 0 && autoLogout) {
      console.log("Token expired, forcing logout...");
      forceLogout();
    }
  };

  useEffect(() => {
    // Initial check
    checkTokenExpiration();

    // Set up interval
    intervalRef.current = setInterval(checkTokenExpiration, checkInterval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [warningThreshold, checkInterval, autoLogout, showWarning]);

  // Reset warning flag when token changes
  useEffect(() => {
    warningShownRef.current = false;
    setShowWarningModal(false);
  }, []);

  const dismissWarning = () => {
    setShowWarningModal(false);
  };

  const extendSession = () => {
    // This would typically call an API to refresh the token
    // For now, we'll just dismiss the warning
    setShowWarningModal(false);
    warningShownRef.current = false;
  };

  return {
    timeRemaining,
    isExpired,
    showWarningModal,
    dismissWarning,
    extendSession,
    checkTokenExpiration,
  };
}
