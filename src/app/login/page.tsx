"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import GlitchText from "@/components/GlitchText";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { setFriendlist, setToken } = useUser();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Login failed");
      setToken(data.token);
      if (Array.isArray(data.friendlist)) setFriendlist(data.friendlist);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-lg">
        <div className="border border-gray-800 p-16 space-y-10 relative overflow-hidden">
          {/* Animated corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-white animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-white animate-pulse"></div>

          <div className="flex justify-center mb-8">
            <GlitchText
              speed={1}
              enableShadows={true}
              enableOnHover={true}
              className="auth-size"
            >
              Split Slice
            </GlitchText>
          </div>

          <div className="relative">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              SIGN IN
            </h1>
            <div className="h-1 w-24 bg-white"></div>
            <p className="text-xs text-gray-500 mt-4 tracking-wide uppercase">
              Enter your credentials to continue
            </p>
          </div>

          <div className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-3 relative">
              <label
                htmlFor="username"
                className="block text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-800 focus:border-white text-white text-base transition-all duration-300 outline-none placeholder-gray-700"
                  placeholder="ENTER USERNAME"
                />
                <div
                  className="absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-300"
                  style={{
                    width: focusedField === "username" ? "100%" : "0%",
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-3 relative">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit(e as any);
                    }
                  }}
                  className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-800 focus:border-white text-white text-base transition-all duration-300 outline-none placeholder-gray-700"
                  placeholder="ENTER PASSWORD"
                />
                <div
                  className="absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-300"
                  style={{
                    width: focusedField === "password" ? "100%" : "0%",
                  }}
                ></div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 transition-all duration-300 text-sm tracking-widest uppercase mt-8 transform hover:scale-[1.02]"
            >
              Sign In →
            </button>
          </div>

          <div className="pt-8 border-t border-gray-900">
            <p className="text-sm text-gray-500 text-center tracking-wide">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-white hover:text-gray-300 font-semibold transition-colors duration-300 uppercase tracking-wider"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-8 tracking-wider uppercase">
          By signing in, you agree to our Terms of Service
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </main>
  );
}
