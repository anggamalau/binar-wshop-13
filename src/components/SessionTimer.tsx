import { useTokenExpiration } from "@/hooks/useTokenExpiration";

interface SessionTimerProps {
  showWarning?: boolean;
  className?: string;
}

export function SessionTimer({
  showWarning = true,
  className = "",
}: SessionTimerProps) {
  const { timeRemaining, isExpired } = useTokenExpiration({
    autoLogout: false,
    showWarning: false,
  });

  if (isExpired || timeRemaining === "No token") {
    return null;
  }

  const getTimerColor = () => {
    const timeInSeconds =
      parseInt(timeRemaining.split("h")[0]) * 3600 ||
      parseInt(timeRemaining.split("m")[0]) * 60 ||
      parseInt(timeRemaining.split("s")[0]) ||
      0;

    if (timeInSeconds <= 300) return "text-red-600"; // 5 minutes
    if (timeInSeconds <= 900) return "text-yellow-600"; // 15 minutes
    return "text-green-600";
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className={`text-sm font-medium ${getTimerColor()}`}>
          Session: {timeRemaining}
        </span>
      </div>

      {showWarning &&
        timeRemaining.includes("m") &&
        parseInt(timeRemaining.split("m")[0]) <= 5 && (
          <div className="flex items-center space-x-1">
            <svg
              className="w-4 h-4 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-xs text-yellow-600">Expiring soon</span>
          </div>
        )}
    </div>
  );
}
