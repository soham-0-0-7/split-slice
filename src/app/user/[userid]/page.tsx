"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useUser } from "@/context/UserContext";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const resolvedParams = React.use(params);
  const { userid } = resolvedParams;
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [viewerUsername, setViewerUsername] = useState<string | null>(null);
  const [netTotal, setNetTotal] = useState<number>(0);
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);
  const { friendlist } = useUser();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/users/get/${userid}`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Failed to load user");
        setProfile(data.user || null);

        const r2 = await fetch(`/api/groups/getGroups/${userid}`);
        const d2 = await r2.json();
        if (r2.ok && Array.isArray(d2.groups)) setGroups(d2.groups);

        const token = localStorage.getItem("token");
        let myUsername: string | null = null;
        if (token) {
          const payload: any = jwtDecode(token as string);
          myUsername = payload?.username ?? null;
          setViewerUsername(myUsername);
          const uid = payload?.userid;
          if (uid) {
            if (Array.isArray(friendlist) && friendlist.length > 0) {
              setIsFriend(
                friendlist.some((id) => String(id) === String(userid))
              );
            } else {
              const f = await fetch(`/api/users/friends/${uid}`);
              const fd = await f.json();
              if (f.ok && Array.isArray(fd.users)) {
                setIsFriend(
                  fd.users.some((u: any) => String(u.userid) === String(userid))
                );
              }
            }
            if (uid == userid) setIsFriend(true);
          }
        }

        if (!myUsername) return;
        const token2 = localStorage.getItem("token");
        if (!token2) return;
        const payload2: any = jwtDecode(token2 as string);
        const myid = payload2?.userid;
        if (!myid) return;

        const counterpartId = data.user?.userid;
        const perGroup: Record<string, any[]> = {};
        let running = 0;

        const groupsArr = d2.groups || [];
        await Promise.all(
          groupsArr.map(async (g: any) => {
            try {
              const r = await fetch(
                `/api/settlements/getByUser/${myid}?groupId=${g.groupid}`
              );
              if (!r.ok) return;
              const jd = await r.json();
              const arr = Array.isArray(jd.settlements) ? jd.settlements : [];
              const filtered = arr.filter(
                (s: any) =>
                  s.payee === counterpartId || s.receiver === counterpartId
              );
              perGroup[String(g.groupid)] = filtered;
              for (const s of filtered) {
                if (s.payee === myid && s.receiver === counterpartId) {
                  running -= s.amount;
                } else if (s.receiver === myid && s.payee === counterpartId) {
                  running += s.amount;
                }
              }
            } catch (e) {
              console.error(e);
            }
          })
        );

        setNetTotal(running);
        const groupsWithSettlements = groupsArr.map((g: any) => ({
          ...g,
          settlements: perGroup[String(g.groupid)] || [],
        }));
        setGroups(groupsWithSettlements);
      } catch (e: any) {
        console.error(e);
      }
    };
    load();
  }, [userid]);

  async function sendReq() {
    if (!viewerUsername) return alert("login required");
    try {
      const res = await fetch(`/api/requests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUsername: viewerUsername,
          toUsername: profile.username,
        }),
      });
      const d = await res.json();
      if (!res.ok) return alert(d.error || "Failed");
      alert(d.message || "Request sent");
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  async function settleAll() {
    if (!viewerUsername || !profile?.username) return alert("missing users");
    if (
      !confirm(`Settle all between ${viewerUsername} and ${profile.username}?`)
    )
      return;
    try {
      const res = await fetch(`/api/settlements/deleteAll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          username1: viewerUsername,
          username2: profile.username,
        }),
      });
      const d = await res.json();
      if (!res.ok) return alert(d.error || "Failed to settle");
      alert(`Deleted ${d.deleted || 0} settlements`);
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-600 tracking-widest uppercase animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 md:px-12 py-8 md:py-16">
        {/* Header Section */}
        <div className="mb-10 md:mb-16 border-b border-gray-800 pb-8 md:pb-12">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white flex items-center justify-center text-2xl sm:text-3xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-2">
                    {profile.username.toUpperCase()}
                  </h1>
                  <div className="text-xs text-gray-600 tracking-widest uppercase">
                    User ID: {profile.userid}
                  </div>
                </div>
              </div>
              <div className="h-1 w-20 sm:w-24 bg-white"></div>
            </div>

            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
              <div className="mb-0 md:mb-6 w-full md:w-auto">
                {netTotal === 0 ? (
                  <div className="text-gray-500 text-sm tracking-wide uppercase text-right">
                    All Settled
                  </div>
                ) : netTotal > 0 ? (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 tracking-widest uppercase mb-1">
                      Owes You
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-400">
                      ₹{netTotal}
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 tracking-widest uppercase mb-1">
                      You Owe
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-red-400">
                      ₹{Math.abs(netTotal)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {isFriend ? (
                  <button
                    className="px-6 py-2 border border-gray-700 text-gray-600 text-sm uppercase tracking-widest font-semibold cursor-not-allowed w-full sm:w-auto"
                    disabled
                  >
                    Friend
                  </button>
                ) : (
                  <button
                    onClick={sendReq}
                    className="px-6 py-2 bg-white text-black text-sm uppercase tracking-widest font-semibold hover:bg-gray-200 transition-all duration-300 w-full sm:w-auto"
                  >
                    Send Request
                  </button>
                )}
                <button
                  onClick={settleAll}
                  className="px-6 py-2 border border-white text-white text-sm uppercase tracking-widest font-semibold hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto"
                >
                  Settle All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                SHARED GROUPS
              </h2>
              <div className="h-[2px] w-16 bg-white"></div>
            </div>
            <div className="text-xs text-gray-600 tracking-widest uppercase">
              {groups.length} {groups.length === 1 ? "Group" : "Groups"}
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="border border-gray-800 py-24 text-center">
              <div className="text-sm text-gray-600 tracking-wide uppercase">
                No shared groups with {profile.username}
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {groups.map((g, idx) => (
                <div
                  key={g.groupid}
                  onMouseEnter={() => setHoveredGroup(g.groupid)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  className="group relative border-b border-gray-800 py-8 px-6 hover:bg-[#111111] transition-all duration-300"
                  style={{
                    animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-lg font-bold transition-all duration-300 group-hover:bg-white group-hover:text-black">
                          {(g.groupname || "G").charAt(0).toUpperCase()}
                        </div>
                        <div className="text-2xl font-bold tracking-tight">
                          {g.groupname || `Group ${g.groupid}`}
                        </div>
                      </div>

                      <div className="ml-16 space-y-2">
                        {g.settlements && g.settlements.length > 0 ? (
                          g.settlements.map((s: any) => (
                            <div key={s.sid} className="text-sm">
                              {s.payee === profile.userid ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-green-400"></div>
                                  <span className="text-gray-400">
                                    {profile.username} will pay you{" "}
                                    <span className="text-green-400 font-semibold">
                                      ₹{s.amount}
                                    </span>
                                  </span>
                                </div>
                              ) : s.receiver === profile.userid ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-red-400"></div>
                                  <span className="text-gray-400">
                                    You will pay {profile.username}{" "}
                                    <span className="text-red-400 font-semibold">
                                      ₹{s.amount}
                                    </span>
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-600 tracking-wide uppercase flex items-center gap-3">
                            <div className="w-2 h-2 bg-gray-700"></div>
                            No settlements in this group
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/groups/${g.groupid}`)}
                      className="px-5 py-2 border border-white text-white text-xs uppercase tracking-widest font-semibold hover:bg-white hover:text-black transition-all duration-300"
                    >
                      Open →
                    </button>
                  </div>

                  {/* Animated underline */}
                  <div
                    className="absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-500 ease-out"
                    style={{
                      width: hoveredGroup === g.groupid ? "100%" : "0%",
                    }}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </div>
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
