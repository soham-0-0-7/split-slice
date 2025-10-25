"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SelectMembers from "@/components/group/createForm/SelectMembers";
import { jwtDecode } from "jwt-decode";

export default function AddMembersPage({ params }: any) {
  const resolvedParams =
    params && typeof (params as any)?.then === "function"
      ? (React as any).use(params)
      : params;
  const groupId = Number(resolvedParams?.groupid);
  const router = useRouter();
  const [group, setGroup] = useState<any | null>(null);
  const [allowed, setAllowed] = useState<boolean>(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/groups/getMembers/${groupId}`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Failed to load group");
        const metaRes = await fetch(`/api/groups/get/${groupId}`);
        const meta = await metaRes.json();
        if (!metaRes.ok)
          return alert(meta.error || "Failed to load group meta");
        setGroup(meta.group);

        const token = localStorage.getItem("token");
        if (!token) return setAllowed(false);
        const payload: any = jwtDecode(token as string);
        const userid = payload?.userid;
        if (!userid) return setAllowed(false);

        if (meta.group.ownersAddOnly) {
          setAllowed(userid === meta.group.owner);
        } else {
          setAllowed(true);
        }
      } catch (e: any) {
        alert(String(e?.message ?? e));
      }
    };
    load();
  }, [groupId]);

  const handleSubmit = async () => {
    if (!selected || selected.length === 0)
      return alert("Select at least one user");
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/addMembers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ groupId, usernames: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data && (data.added || data.alreadyMembers || data.notFound)) {
          const msgParts: string[] = [];
          if (Array.isArray(data.added) && data.added.length > 0)
            msgParts.push(`Added: ${data.added.join(", ")}`);
          if (
            Array.isArray(data.alreadyMembers) &&
            data.alreadyMembers.length > 0
          )
            msgParts.push(`Already members: ${data.alreadyMembers.join(", ")}`);
          if (Array.isArray(data.notFound) && data.notFound.length > 0)
            msgParts.push(`Not found: ${data.notFound.join(", ")}`);
          alert(msgParts.join(" \n") || data.error || "Failed to add members");
          if (Array.isArray(data.added) && data.added.length > 0)
            return router.push(`/groups/${groupId}?tab=members`);
          return;
        }
        return alert(data.error || "Failed to add members");
      }
      const parts: string[] = [];
      if (data.added && data.added.length)
        parts.push(`Added: ${data.added.join(", ")}`);
      if (data.alreadyMembers && data.alreadyMembers.length)
        parts.push(`Already members: ${data.alreadyMembers.join(", ")}`);
      if (data.notFound && data.notFound.length)
        parts.push(`Not found: ${data.notFound.join(", ")}`);
      if (parts.length) alert(parts.join("\n"));
      else alert(data.message || "Members added");
      router.push(`/groups/${groupId}?tab=members`);
    } catch (e: any) {
      alert(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  if (!group) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-lg tracking-wide animate-pulse">
          LOADING...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-gray-300 text-2xl font-light tracking-wider">
            UNAUTHORIZED
          </div>
          <div className="text-gray-500 text-sm">
            You don't have permission to add members
          </div>
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="mt-6 px-6 py-2 border border-gray-700 text-gray-300 hover:bg-white hover:text-black transition-all duration-300 tracking-wider text-sm"
          >
            ← BACK TO GROUP
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="text-gray-500 hover:text-gray-300 transition-colors duration-200 text-sm tracking-wider mb-6 inline-flex items-center gap-2"
          >
            ← BACK TO GROUP
          </button>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-5xl font-light tracking-tight mb-2">
                ADD MEMBERS
              </h1>
              <div className="h-1 w-20 bg-white"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-8">
          <div className="text-gray-500 text-sm tracking-wider mb-2">GROUP</div>
          <div className="text-2xl font-light tracking-wide">
            {group.groupname}
          </div>
        </div>

        {/* Members Selection Area */}
        <div className="border border-gray-800 bg-[#111111] transition-all duration-300 hover:border-gray-700">
          <div className="p-8">
            <div className="mb-6">
              <div className="text-gray-400 text-xs tracking-widest mb-4">
                SELECT MEMBERS TO ADD
              </div>
              <SelectMembers
                onChange={(m) => setSelected(m)}
                options={group.membersList}
              />
            </div>

            {selected.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800 animate-fadeIn">
                <div className="text-gray-500 text-xs tracking-widest mb-3">
                  SELECTED ({selected.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.map((username, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-white text-black text-sm tracking-wide"
                    >
                      {username}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-800 p-6 flex gap-4">
            <button
              onClick={() => router.push(`/groups/${groupId}`)}
              disabled={loading}
              className="flex-1 py-3 border border-gray-700 text-gray-300 hover:bg-gray-900 transition-all duration-300 tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selected.length === 0}
              className="flex-1 py-3 bg-white text-black hover:bg-gray-200 transition-all duration-300 tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"
            >
              {loading ? "ADDING..." : "ADD MEMBERS"}
            </button>
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-6 text-gray-600 text-xs tracking-wide">
          Selected members will be added to the group immediately
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
