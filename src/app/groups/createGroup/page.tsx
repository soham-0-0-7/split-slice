"use client";

import React, { useEffect, useState } from "react";
import SelectMembers from "@/components/group/createForm/SelectMembers";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useUser } from "@/context/UserContext";

export default function CreateGroupPage() {
  const router = useRouter();
  const { friendlist } = useUser();
  const [friends, setFriends] = useState<
    { userid: number; username: string }[]
  >([]);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [groupname, setGroupname] = useState("");
  const [ownersAddOnly, setOwnersAddOnly] = useState(false);
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

    const load = async () => {
      if (Array.isArray(friendlist) && friendlist.length > 0) {
        try {
          const res = await fetch(`/api/users/byIds`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: friendlist }),
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data.users)) setFriends(data.users);
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          const res = await fetch(`/api/users/friends/${userid}`);
          const data = await res.json();
          if (res.ok && Array.isArray(data.users)) setFriends(data.users);
        } catch (e) {
          console.error(e);
        }
      }
    };
    load();
  }, [friendlist, router]);

  const addMember = (username: string) => {
    const trimmed = username.trim();
    if (!trimmed || selectedUsernames.includes(trimmed)) return;
    setSelectedUsernames((prev) => [...prev, trimmed]);
    setInputValue("");
    setShowDropdown(false);
  };

  const removeMember = (username: string) => {
    setSelectedUsernames((prev) => prev.filter((m) => m !== username));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupname.trim()) return alert("Group name required");
    const token = localStorage.getItem("token");
    if (!token) return router.replace("/login");
    let ownerUserid: number | null = null;
    try {
      const payload: any = jwtDecode(token as string);
      ownerUserid = payload?.userid ?? null;
    } catch (e) {
      console.error(e);
      return router.replace("/login");
    }
    if (ownerUserid === null) return router.replace("/login");

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupname: groupname.trim(),
          ownerUserid,
          members: selectedUsernames,
          ownersAddOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to create group");
      alert(data.message || "Group created");
      router.push("/groups");
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const filteredFriends =
    friends.filter(
      (f) =>
        f.username.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedUsernames.includes(f.username)
    ) || [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <button
            onClick={() => router.push("/groups")}
            className="text-gray-500 hover:text-gray-300 transition-colors duration-200 text-sm tracking-wider mb-6 inline-flex items-center gap-2"
          >
            ← BACK TO GROUPS
          </button>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-5xl font-light tracking-tight mb-2">
                CREATE GROUP
              </h1>
              <div className="h-1 w-20 bg-white"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="border border-gray-800 bg-[#111111]">
          <div className="p-8 space-y-8">
            {/* Group Name */}
            <div>
              <label className="block text-xs tracking-widest text-gray-500 mb-3">
                GROUP NAME
              </label>
              <input
                value={groupname}
                onChange={(e) => setGroupname(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 focus:border-white text-white placeholder-gray-600 focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Select Members */}
            <div>
              <label className="block text-xs tracking-widest text-gray-500 mb-3">
                ADD MEMBERS
              </label>
              {typeof window !== "undefined" ? (
                <React.Suspense
                  fallback={
                    <div className="text-gray-600 text-sm">Loading...</div>
                  }
                >
                  <SelectMembers
                    options={friends}
                    onChange={(members: string[]) =>
                      setSelectedUsernames(members)
                    }
                  />
                </React.Suspense>
              ) : null}

              {/* {selectedUsernames.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-800 animate-fadeIn">
                  <div className="text-gray-500 text-xs tracking-widest mb-3">
                    SELECTED MEMBERS ({selectedUsernames.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsernames.map((username, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1 bg-white text-black text-sm tracking-wide flex items-center gap-2"
                      >
                        {username}
                        <button
                          type="button"
                          onClick={() => removeMember(username)}
                          className="hover:text-gray-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </div>

            {/* Owner Permission */}
            <div className="pt-6 border-t border-gray-800">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ownersAddOnly}
                  onChange={(e) => setOwnersAddOnly(e.target.checked)}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors tracking-wide">
                  Only owner can add members
                </span>
              </label>
              <div className="mt-2 text-xs text-gray-600 ml-7">
                When enabled, only you will be able to add new members to this
                group
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-800 p-6 flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/groups")}
              disabled={loading}
              className="flex-1 py-3 border border-gray-700 text-gray-300 hover:bg-gray-900 transition-all duration-300 tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-white text-black hover:bg-gray-200 transition-all duration-300 tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"
            >
              {loading ? "CREATING..." : "CREATE GROUP"}
            </button>
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-6 text-gray-600 text-xs tracking-wide">
          You will be added as the owner and can manage this group
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
