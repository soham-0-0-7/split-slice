"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function FriendsPage() {
  const router = useRouter();
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.replace("/login");
    let userid: number | null = null;
    try {
      const payload: any = jwtDecode(token as string);
      userid = payload?.userid ?? null;
    } catch (e) {
      console.error(e);
      return router.replace("/login");
    }

    if (userid === null) return router.replace("/login");

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/friends/getFriends/${userid}`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Failed to load friends");
        setUsernames(Array.isArray(data.usernames) ? data.usernames : []);
      } catch (err: any) {
        alert(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [router]);

  async function sendFriendRequest() {
    const toUsername = window.prompt(
      "Enter username to send friend request to:"
    );
    if (!toUsername) return;
    // get from username from token
    const token = localStorage.getItem("token");
    if (!token) return router.replace("/login");
    let fromUsername: string | null = null;
    try {
      const payload: any = jwtDecode(token as string);
      fromUsername = payload?.username ?? null;
    } catch (e) {
      console.error(e);
      return router.replace("/login");
    }
    if (!fromUsername) return alert("Could not determine your username");

    try {
      const res = await fetch(`/api/requests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUsername, toUsername }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to send request");
      alert(data.message || "Request sent");
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  async function removeFriend(toDelete: string) {
    const ok = window.confirm(`Remove ${toDelete} from your friends?`);
    if (!ok) return;
    const token = localStorage.getItem("token");
    if (!token) return router.replace("/login");
    let fromUsername: string | null = null;
    try {
      const payload: any = jwtDecode(token as string);
      fromUsername = payload?.username ?? null;
    } catch (e) {
      console.error(e);
      return router.replace("/login");
    }
    try {
      const res = await fetch(`/api/friends/removeFriend`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUsername, toDelete }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to remove friend");
      alert(data.message || "Removed");
      // refresh list
      const token2 = localStorage.getItem("token");
      const payload2: any = jwtDecode(token2 as string);
      const userid = payload2?.userid;
      const r = await fetch(`/api/friends/getFriends/${userid}`);
      const d = await r.json();
      setUsernames(Array.isArray(d.usernames) ? d.usernames : []);
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-[0.15]">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-20">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-2 mb-8 text-sm tracking-widest text-gray-500 hover:text-white transition-colors duration-300"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform duration-300">
              ←
            </span>
            <span>BACK TO DASHBOARD</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b-2 border-neutral-800 pb-8">
            <div className="space-y-3">
              <div className="overflow-hidden">
                <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tighter animate-slide-up">
                  FRIENDS
                </h1>
              </div>
              <div className="h-px w-24 bg-white origin-left animate-expand"></div>
            </div>

            <div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 opacity-0 animate-fade-in w-full sm:w-auto"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
            >
              <button
                onClick={() => router.push("/friends/requests")}
                className="group relative px-6 py-3 text-sm font-semibold tracking-wider text-white border-2 border-white overflow-hidden transition-all duration-300 hover:text-black w-full sm:w-auto"
              >
                <span className="relative z-10">REQUESTS</span>
                <div className="absolute inset-0 bg-white transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
              <button
                onClick={sendFriendRequest}
                className="relative px-6 py-3 text-sm font-semibold tracking-wider text-black bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl group w-full sm:w-auto"
              >
                <span className="relative z-10">ADD FRIEND</span>
                <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold tracking-wider">
                  ADD FRIEND
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm tracking-widest text-gray-500">LOADING</p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-neutral-800">
            {usernames.length === 0 ? (
              <div className="px-8 py-32 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-neutral-800 mb-8">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm tracking-widest text-gray-500 mb-8">
                  NO FRIENDS YET
                </p>
                <button
                  onClick={sendFriendRequest}
                  className="group relative px-8 py-3 text-sm font-semibold tracking-wider text-white border-2 border-white overflow-hidden transition-all duration-300 hover:text-black"
                >
                  <span className="relative z-10">SEND YOUR FIRST REQUEST</span>
                  <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                </button>
              </div>
            ) : (
              <div>
                {usernames.map((u, idx) => (
                  <div
                    key={u}
                    className="group relative border-b-2 border-neutral-800 last:border-b-0 hover:bg-white transition-colors duration-300"
                    style={{
                      animation: `slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${
                        idx * 0.05
                      }s both`,
                    }}
                  >
                    <div className="px-8 py-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 border-2 border-neutral-800 group-hover:border-black flex items-center justify-center text-white group-hover:text-black text-lg font-bold transition-colors duration-300">
                          {u.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={async () => {
                            // resolve username -> userid then navigate
                            try {
                              const r = await fetch(
                                `/api/users/byUsername/${u}`
                              );
                              const d = await r.json();
                              if (!r.ok) return alert(d.error || "Failed");
                              const uid = d.user?.userid;
                              if (!uid) return alert("user not found");
                              router.push(`/user/${uid}`);
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-lg font-semibold text-white group-hover:text-black tracking-tight transition-colors duration-300 hover:underline"
                        >
                          {u}
                        </button>
                      </div>
                      <button
                        onClick={() => removeFriend(u)}
                        className="relative text-sm font-semibold tracking-wider text-white group-hover:text-black transition-colors duration-300 px-4 py-2 border-2 border-transparent hover:border-black"
                      >
                        REMOVE
                      </button>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-black group-hover:h-full transition-all duration-300"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friend count indicator */}
        {!loading && usernames.length > 0 && (
          <div
            className="mt-8 flex items-center justify-between px-2 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
          >
            <p className="text-sm tracking-widest text-gray-500">
              TOTAL: {usernames.length}{" "}
              {usernames.length === 1 ? "FRIEND" : "FRIENDS"}
            </p>
            <div className="h-px w-32 bg-white"></div>
          </div>
        )}
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

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
