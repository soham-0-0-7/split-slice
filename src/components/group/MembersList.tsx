"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useUser } from "@/context/UserContext";

export default function MembersList({
  groupid,
  friendUsernames,
  isOwner,
}: {
  groupid: string;
  friendUsernames?: string[];
  isOwner?: boolean;
}) {
  const [members, setMembers] = useState<
    { userid: number; username: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { token } = useUser();
  const [requestsMap, setRequestsMap] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/getMembers/${groupid}`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Failed to load members");
        const loaded = Array.isArray(data.members) ? data.members : [];
        console.debug("MembersList: loaded members:", loaded);
        setMembers(loaded);
      } catch (err: any) {
        alert(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupid]);

  // derive current user's id/username from context token if available
  let myUserid: number | null = null;
  let myUsername: string | null = null;
  try {
    if (token) {
      const payload: any = jwtDecode(token as string);
      myUserid = typeof payload?.userid === "number" ? payload.userid : null;
      myUsername =
        typeof payload?.username === "string" ? payload.username : null;
    }
  } catch (e) {
    myUserid = null;
  }

  // fetch existing friend requests (sent/received) involving current user
  useEffect(() => {
    const loadReqs = async () => {
      if (!myUserid) return;
      try {
        const res = await fetch(`/api/requests/get/${myUserid}`);
        const data = await res.json();
        if (!res.ok) return;
        // data.requests: [{ rid, username, status }]
        const map: Record<string, string> = {};
        for (const r of data.requests || []) {
          map[r.username] = r.status; // 'sent' | 'received'
        }
        setRequestsMap(map);
      } catch (e) {
        console.error(e);
      }
    };
    loadReqs();
  }, [myUserid]);

  // helper to determine if a member is already a friend according to provided friendUsernames prop
  const isFriend = (member: { userid: number; username: string }) => {
    if (!Array.isArray(friendUsernames) || friendUsernames.length === 0)
      return false;
    const lowerSet = new Set(
      friendUsernames.map((s) => String(s).trim().toLowerCase())
    );
    return lowerSet.has(String(member.username).trim().toLowerCase());
  };

  const sendFriendReq = async (toUsername: string) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("login required");
    let fromUsername: string | null = null;
    try {
      const payload: any = jwtDecode(token as string);
      fromUsername = payload?.username ?? null;
    } catch (e) {
      return alert("login required");
    }
    try {
      const res = await fetch(`/api/requests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUsername, toUsername }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to send request");
      alert(data.message || "Request sent");
      // update requestsMap to mark as sent
      setRequestsMap((prev) => ({ ...prev, [toUsername]: "sent" }));
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  };

  return (
    <div className="relative">
      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-8">
          <div className="w-1 h-1 bg-gray-500 animate-pulse"></div>
          <div className="text-sm uppercase tracking-wider">
            Loading members...
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-gray-600 text-sm uppercase tracking-wider">
            No members
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {members.map((m, idx) => (
            <div
              key={m.userid}
              style={{ animationDelay: `${idx * 40}ms` }}
              className="border-l-2 border-transparent hover:border-white transition-all duration-300 
                       bg-[#1a1a1a] hover:bg-[#2a2a2a] animate-slideIn group"
            >
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 bg-white flex items-center justify-center 
                                text-sm font-bold text-black shrink-0"
                  >
                    {m.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => router.push(`/user/${m.userid}`)}
                      className="text-white font-medium text-base hover:text-gray-300 
                               transition-colors duration-200 truncate block text-left"
                    >
                      {m.username}
                    </button>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">
                      ID: {m.userid}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {m.userid !== myUserid &&
                    !isFriend(m) &&
                    (requestsMap[m.username] === "sent" ? (
                      <div
                        className="px-4 py-2 text-xs text-gray-600 uppercase tracking-wider 
                                    border border-gray-800"
                      >
                        Request sent
                      </div>
                    ) : (
                      <button
                        onClick={() => sendFriendReq(m.username)}
                        className="px-4 py-2 text-xs bg-white text-black uppercase tracking-wider 
                                 hover:bg-gray-300 transition-colors duration-200"
                      >
                        Send Req
                      </button>
                    ))}
                </div>
              </div>

              {idx < members.length - 1 && (
                <div className="h-[1px] bg-gray-900 mx-6"></div>
              )}
            </div>
          ))}
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `,
        }}
      />
    </div>
  );
}
