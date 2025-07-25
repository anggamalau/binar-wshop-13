import { useEffect, useState } from "react";
import { useTokenExpiration } from "@/hooks/useTokenExpiration";

interface TokenExpirationWarningProps {
  warningThreshold?: number;
  showCountdown?: boolean;
  onLogout?: () => void;
  onExtend?: () => void;
}

export function TokenExpirationWarning({
  warningThreshold = 300,
  showCountdown = true,
  onLogout,
  onExtend,
}: TokenExpirationWarningProps) {
  const {
    timeRemaining,
    isExpired,
    showWarningModal,
    dismissWarning,
    extendSession,
  } = useTokenExpiration({
    warningThreshold,
    autoLogout: false, // Let the component handle logout
    showWarning: false, // We'll handle warnings manually
  });

  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (showWarningModal && showCountdown) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Auto logout when countdown reaches 0
            if (onLogout) {
              onLogout();
            } else {
              window.location.href = "/login";
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showWarningModal, showCountdown, onLogout]);

  useEffect(() => {
    if (showWarningModal) {
      setCountdown(60); // 60 second countdown
    }
  }, [showWarningModal]);

  const handleLogout = () => {
    dismissWarning();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = "/login";
    }
  };

  const handleExtend = () => {
    if (onExtend) {
      onExtend();
    }
    extendSession();
  };

  if (!showWarningModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Session Expiring Soon
            </h3>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Your session will expire in{" "}
            <span className="font-semibold">{timeRemaining}</span>. Please save
            your work and log in again to continue.
          </p>

          {showCountdown && countdown > 0 && (
            <div className="mt-3 p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">
                Auto logout in: <span className="font-bold">{countdown}s</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleExtend}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Extend Session
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Logout Now
          </button>
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={dismissWarning}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
