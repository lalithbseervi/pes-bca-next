"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/ClientLayout";
import axiosClient from "@/lib/axios_client";

export default function AuthenticatePage() {
  const { session, setSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const srn_pattern = /^[PES]{3}[1-2]{1}[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/i;
  const prn_pattern = /^[PES]{3}[1-2]\d{9}$/i;
  const phone_no = /^[0-9]{10}$/i;

  const redirectTo = searchParams?.get("redirect") || "/";

  // Set page title
  useEffect(() => {
    document.title = "Login | lms";
  }, []);

  const handleUsernameChange = (e) => {
    const username_val = String(e.target.value);
    if (srn_pattern.test(username_val)) {
      console.log("Valid SRN: ", username_val);
    } else if (prn_pattern.test(username_val)) {
      console.log("Valid PRN: ", username_val);
    } else if (username_val.includes("@")) {
      console.log("Valid Email: ", username_val);
    } else if (phone_no.test(username_val)) {
      console.log("Valid Phone: ", username_val);
    } else {
      console.warn("Invalid username: ", username_val);
    }
    setUsername(username_val);
  };

  // Sync autofilled values with state
  useEffect(() => {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    if (usernameInput?.value) {
      setUsername(usernameInput.value);
    }
    if (passwordInput?.value) {
      setPassword(passwordInput.value);
    }
  }, []);

  useEffect(() => {
    if (session) {
      router.replace(redirectTo || "/");
    }
  }, [session, redirectTo, router]);

  const login = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axiosClient.post("/api/authenticate", {
        username: username,
        password,
      });

      console.log("Full authResponse:", data);
      setSession(data.session);
      router.replace(redirectTo || "/");
    } catch (error) {
      console.error("Authentication error:", error);
      
      // Extract error message from response
      let errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Authentication failed. Please try again.";

      errorMessage = String(errorMessage); // Ensure it's a string

      if (errorMessage.includes("course_id")) {
        errorMessage = `No resources are there for this course. Please wait while they are being added.\n\nFull Error: ${errorMessage}`
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-neutral-900">
      <div className="flex flex-col w-full max-w-2xl mx-4 gap-4 rounded-md bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 shadow-xl">
        <header className="text-2xl p-4 bg-gray-200 dark:bg-neutral-800 rounded-t-md text-gray-900 dark:text-gray-100">Student Login</header>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-8">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-emerald-600 border-t-emerald-300 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-emerald-600 dark:text-emerald-400">Authenticating...</p>
            <p className="text-md text-gray-700 dark:text-gray-300">This might take a while (upto 2 mins)</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-8 pb-8 pt-4">
            <label className="text-lg text-gray-900 dark:text-gray-100">SRN / PRN / Email:</label>
            <input
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              className="p-3 rounded-md bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:border-emerald-600 focus:outline-none autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] dark:autofill:shadow-[inset_0_0_0px_1000px_rgb(42,42,42)] mb-2 w-full"
            />
            <label className="text-lg text-gray-900 dark:text-gray-100">Password (PESU Academy password)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-3 pr-16 rounded-md bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:border-emerald-600 focus:outline-none autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] dark:autofill:shadow-[inset_0_0_0px_1000px_rgb(42,42,42)] w-full"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 px-2 py-1 rounded hover:cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <button
              type="submit"
              onClick={login}
              className="text-lg bg-emerald-700 dark:bg-emerald-900 hover:bg-emerald-600 dark:hover:bg-emerald-800 text-white w-full py-3 mt-4 rounded-md hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              disabled={loading ? true : false}
            >
              Login
            </button>
          </div>
        )}
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 border border-red-500 dark:border-red-600 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4">Authentication Error</h3>
            <p className="text-gray-800 dark:text-neutral-200 mb-6 whitespace-pre-wrap">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full bg-red-600 dark:bg-red-900 hover:bg-red-700 dark:hover:bg-red-800 text-white py-2 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
