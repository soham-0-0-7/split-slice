"use client";

import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

type Group = {
  groupid: number;
  groupname: string;
  owner: number;
  members: number[];
  createdOn: string;
  ownersAddOnly: boolean;
  isOwner: boolean;
  isMember: boolean;
};

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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

    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/getGroups/${userid}`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Failed to load groups");
        setGroups(Array.isArray(data.groups) ? data.groups : []);
      } catch (err: any) {
        alert(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-16">
        {/* Header */}
        <div className="mb-12 md:mb-20">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-white mb-6 md:mb-8 flex items-center transition-all duration-300 tracking-wide uppercase"
          >
            <span className="mr-2">←</span> Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-gray-800 pb-6">
            <div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-2">
                GROUPS
              </h1>
              <div className="h-1 w-24 bg-white"></div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push("/groups/createGroup")}
                className="px-6 md:px-8 py-3 bg-white text-black font-semibold tracking-wide uppercase text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 self-start"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-sm text-gray-600 tracking-widest uppercase animate-pulse">
              Loading...
            </div>
          </div>
        ) : (
          <div>
            {groups.length === 0 ? (
              <div className="py-32 text-center border border-gray-800">
                <div className="w-20 h-20 mx-auto mb-6 text-gray-700">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 tracking-wide uppercase">
                  No groups yet
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {groups.map((g, idx) => (
                  <div
                    key={g.groupid}
                    onClick={() => router.push(`/groups/${g.groupid}`)}
                    onMouseEnter={() => setHoveredId(g.groupid)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative border-b border-gray-800 py-6 md:py-8 px-4 sm:px-6 cursor-pointer transition-all duration-300 hover:bg-[#111111]"
                    style={{
                      animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white flex items-center justify-center text-white text-lg sm:text-xl font-bold transition-all duration-300 group-hover:bg-white group-hover:text-black shrink-0">
                          {g.groupname.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <span className="text-xl sm:text-2xl font-bold tracking-tight truncate block">
                            {g.groupname}
                          </span>
                          <div className="flex items-center gap-3 sm:gap-4 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold px-3 py-1 border border-gray-700">
                              {g.isOwner ? "Owner" : g.isMember ? "Member" : ""}
                            </span>
                            <span className="text-xs text-gray-600">
                              {new Date(g.createdOn)
                                .toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                                .toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4">
                        {g.isOwner && (
                          <button
                            onClick={async (ev) => {
                              ev.stopPropagation();
                              if (
                                !confirm(
                                  "Delete group? This will remove all expenses and members."
                                )
                              )
                                return;
                              try {
                                const res = await fetch(
                                  `/api/groups/delete/${g.groupid}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem(
                                        "token"
                                      )}`,
                                    },
                                  }
                                );
                                const d = await res.json();
                                if (!res.ok)
                                  return alert(
                                    d.error || "Failed to delete group"
                                  );
                                setGroups((prev) =>
                                  prev.filter((x) => x.groupid !== g.groupid)
                                );
                                alert(d.message || "Group deleted");
                              } catch (e: any) {
                                alert(e?.message || String(e));
                              }
                            }}
                            className="px-3 sm:px-4 py-2 text-xs border border-white text-white uppercase tracking-widest font-semibold hover:bg-white hover:text-black transition-all duration-300"
                          >
                            Delete
                          </button>
                        )}

                        <div className="text-gray-600 transition-transform duration-300 group-hover:translate-x-2">
                          →
                        </div>
                      </div>
                    </div>

                    {/* Animated underline on hover */}
                    <div
                      className="absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-500 ease-out"
                      style={{
                        width: hoveredId === g.groupid ? "100%" : "0%",
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            )}

            {groups.length > 0 && (
              <div className="mt-12 pt-6 border-t border-gray-900">
                <div className="text-sm text-gray-600 tracking-widest uppercase">
                  Total: {groups.length}{" "}
                  {groups.length === 1 ? "Group" : "Groups"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
