"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

// Extracted components for better readability
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const DemoCredentials = () => (
  <div className="mt-6 p-4 bg-blue-50 rounded-md">
    <p className="text-sm text-blue-800">
      <strong>Demo Credentials:</strong> Use any seeded user email with
      password: <code>User123@</code>
    </p>
  </div>
);

const PasswordInput = ({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
}: {
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  error?: string;
}) => (
  <div>
    <label
      htmlFor="password"
      className="block text-sm font-medium text-gray-900"
    >
      Password
    </label>
    <div className="relative">
      <input
        id="password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 3C5 3 1.73 7.11 1.08 7.98a1 1 0 000 1.04C1.73 12.89 5 17 10 17s8.27-4.11 8.92-4.98a1 1 0 000-1.04C18.27 7.11 15 3 10 3zm0 12c-3.87 0-7.16-3.13-7.72-3.8C2.84 10.13 6.13 7 10 7s7.16 3.13 7.72 3.8C17.16 11.87 13.87 15 10 15zm0-8a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M4.03 3.97a.75.75 0 10-1.06 1.06l1.1 1.1C2.7 7.11 1.73 8.89 1.08 9.96a1 1 0 000 1.08C1.73 12.89 5 17 10 17c1.61 0 3.09-.37 4.38-1.01l1.59 1.59a.75.75 0 101.06-1.06l-15-15zm7.45 9.57a2 2 0 01-2.45-2.45l2.45 2.45zm-4.02-4.02l2.45 2.45a2 2 0 01-2.45-2.45zm9.54 2.44c-.56.67-3.85 3.8-7.72 3.8-1.61 0-3.09-.37-4.38-1.01l1.59 1.59a.75.75 0 101.06-1.06l-1.1-1.1C2.7 12.89 1.73 11.11 1.08 10.04a1 1 0 010-1.08C1.73 7.11 5 3 10 3c1.61 0 3.09.37 4.38 1.01l1.59-1.59a.75.75 0 101.06 1.06l-1.1 1.1C17.3 7.11 18.27 8.89 18.92 9.96a1 1 0 010 1.08z" />
          </svg>
        )}
      </button>
    </div>
    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, loading, login } = useAuth();
  const router = useRouter();

  // Memoized validation function to prevent unnecessary re-computations
  const validate = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    if (!loading && user) {
      router.push("/users");
    }
  }, [loading, user, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validate() || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      const toastId = toast.loading("Logging in...");

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = await response.json();

        if (response.ok) {
          login(data.token, data.user);
          toast.success("Login successful!", { id: toastId });
          router.push("/users");
        } else {
          toast.error(data.message || "An error occurred.", { id: toastId });
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Network error occurred.", { id: toastId });
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, validate, isSubmitting, login, router]
  );

  // Memoized form inputs to prevent unnecessary re-renders
  const emailInput = useMemo(
    () => (
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-900"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
    ),
    [email, errors.email, isSubmitting]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {emailInput}
          <PasswordInput
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={errors.password}
          />
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <DemoCredentials />
      </div>
    </div>
  );
}
