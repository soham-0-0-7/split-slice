"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function FriendRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<
    { rid: number; username: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

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

    const fetchReqs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/requests/get/${userid}`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Failed to load requests");
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch (err: any) {
        alert(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchReqs();
  }, [router]);

  async function handleAction(rid: number, action: "accept" | "reject") {
    setProcessingId(rid);
    try {
      const res = await fetch(`/api/requests/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rid, action }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to perform action");
      alert(data.message || "Done");
      setRequests((prev) => prev.filter((r) => r.rid !== rid));
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRevoke(rid: number, username: string) {
    setProcessingId(rid);
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
      const res = await fetch(`/api/requests/revoke`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUsername,
          toUsername: username,
        }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to revoke");
      alert(data.message || "Revoked");
      setRequests((prev) => prev.filter((x) => x.rid !== rid));
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.5s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }

        .stagger-1 {
          animation-delay: 0.1s;
          opacity: 0;
        }

        .stagger-2 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .stagger-3 {
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="border-b border-neutral-800 pb-10 mb-16 animate-fade-in">
          <button
            onClick={() => router.push("/friends")}
            className="text-sm text-neutral-500 hover:text-white mb-6 flex items-center transition-all duration-300 group"
          >
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>
            <span className="uppercase tracking-wider">Back to Friends</span>
          </button>
          <h1 className="text-6xl font-bold text-white tracking-tight mb-2">
            FRIEND REQUESTS
            <div className="h-1 w-32 bg-white mt-4"></div>
          </h1>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32 animate-fade-in">
            <div className="text-center">
              <div
                className="w-16 h-16 border-2 border-neutral-800 border-t-white mx-auto mb-4 animate-spin"
                style={{ borderRadius: "2px" }}
              ></div>
              <div className="text-sm text-neutral-500 uppercase tracking-widest">
                Loading
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm animate-fade-in">
            {requests.length === 0 ? (
              <div className="px-8 py-32 text-center animate-slide-in">
                <div className="w-20 h-20 border-2 border-neutral-800 mx-auto mb-6 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-neutral-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <p className="text-sm text-neutral-500 uppercase tracking-widest">
                  No Pending Requests
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left px-8 py-5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      Username
                    </th>
                    <th className="text-right px-8 py-5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, index) => (
                    <tr
                      key={r.rid}
                      className={`border-b border-neutral-800 last:border-b-0 transition-all duration-300 animate-slide-in stagger-${Math.min(
                        index + 1,
                        3
                      )} ${
                        hoveredRow === r.rid
                          ? "bg-neutral-800/50"
                          : "bg-transparent"
                      }`}
                      onMouseEnter={() => setHoveredRow(r.rid)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 border border-neutral-700 flex items-center justify-center text-neutral-400 text-sm font-bold transition-all duration-300 hover:border-white hover:text-white">
                            {r.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-base text-white font-medium tracking-wide">
                            {r.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {r.status === "sent" ? (
                          <div className="flex justify-end items-center gap-4">
                            <span className="text-xs text-neutral-500 uppercase tracking-widest">
                              Pending
                            </span>
                            <button
                              className="px-6 py-2.5 text-xs font-bold text-white border border-white uppercase tracking-widest transition-all duration-300 hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleRevoke(r.rid, r.username)}
                              disabled={processingId === r.rid}
                            >
                              {processingId === r.rid ? "..." : "Revoke"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button
                              className="px-6 py-2.5 text-xs font-bold text-white border border-neutral-700 uppercase tracking-widest transition-all duration-300 hover:border-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleAction(r.rid, "reject")}
                              disabled={processingId === r.rid}
                            >
                              {processingId === r.rid ? "..." : "Decline"}
                            </button>
                            <button
                              className="px-6 py-2.5 text-xs font-bold text-black bg-white uppercase tracking-widest transition-all duration-300 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleAction(r.rid, "accept")}
                              disabled={processingId === r.rid}
                            >
                              {processingId === r.rid ? "..." : "Accept"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
