"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useUser } from "@/context/UserContext";

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      // decode without verifying
      const payload: any = jwtDecode(token);
      setUsername(payload?.username ?? null);
    } catch (e) {
      console.error(e);
      router.replace("/login");
    }
  }, [router]);

  function logout() {
    // clear token and friendlist from context (and localStorage via provider)
    try {
      const { setToken, setFriendlist } = useUser();
      setToken(null);
      setFriendlist([]);
    } catch (err) {
      // fallback if context isn't available
      localStorage.removeItem("token");
    }
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 opacity-[0.15]">
        <div
          className="absolute top-0 -left-40 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-0 -right-40 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="mb-32">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-3">
              <div className="overflow-hidden">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tighter animate-slide-up">
                  DASHBOARD
                </h1>
              </div>
              <div className="h-px w-32 bg-white origin-left animate-expand"></div>
            </div>
            <button
              onClick={logout}
              className="group relative px-8 py-3 text-sm font-semibold tracking-wider text-white border-2 border-white overflow-hidden transition-all duration-300 hover:text-black"
            >
              <span className="relative z-10">LOGOUT</span>
              <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </button>
          </div>

          <div
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
          >
            <p className="text-sm tracking-widest text-gray-500 uppercase mb-2">
              Welcome back
            </p>
            <p className="text-3xl font-light text-white">{username ?? ""}</p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Friends Section */}
          <button
            onClick={() => router.push("/friends")}
            className="group relative border-t-2 border-l-2 border-neutral-800 p-8 sm:p-12 md:p-20 text-left overflow-hidden transition-all duration-500 hover:bg-white hover:border-white"
          >
            <div className="relative z-10">
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-neutral-800 group-hover:border-black transition-colors duration-500">
                  <svg
                    className="w-8 h-8 text-white group-hover:text-black transition-colors duration-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-white group-hover:text-black tracking-tight transition-colors duration-500">
                  FRIENDS
                </h2>
                <div className="h-px w-24 bg-white group-hover:bg-black transition-colors duration-500"></div>
                <p className="text-sm text-gray-400 group-hover:text-gray-700 tracking-wide leading-relaxed transition-colors duration-500 max-w-xs">
                  Connect with your friends and manage your friend list
                </p>
              </div>
            </div>

            {/* Hover line animation */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-black group-hover:w-full transition-all duration-700"></div>
          </button>

          {/* Groups Section */}
          <button
            onClick={() => router.push("/groups")}
            className="group relative border-t-2 border-l-2 border-r-2 border-neutral-800 p-8 sm:p-12 md:p-20 text-left overflow-hidden transition-all duration-500 hover:bg-white hover:border-white"
          >
            <div className="relative z-10">
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-neutral-800 group-hover:border-black transition-colors duration-500">
                  <svg
                    className="w-8 h-8 text-white group-hover:text-black transition-colors duration-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-white group-hover:text-black tracking-tight transition-colors duration-500">
                  GROUPS
                </h2>
                <div className="h-px w-24 bg-white group-hover:bg-black transition-colors duration-500"></div>
                <p className="text-sm text-gray-400 group-hover:text-gray-700 tracking-wide leading-relaxed transition-colors duration-500 max-w-xs">
                  Join groups and collaborate with multiple people
                </p>
              </div>
            </div>

            {/* Hover line animation */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-black group-hover:w-full transition-all duration-700"></div>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes expand {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-expand {
          animation: expand 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
          transform: scaleX(0);
        }

        .animate-fade-in {
          opacity: 0;
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  );
}
