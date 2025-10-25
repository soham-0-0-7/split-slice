"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function CreateExpensePage({
  params,
}: {
  params: Promise<{ groupid: string }>;
}) {
  const resolvedParams = React.use(params);
  const groupId = Number(resolvedParams.groupid);
  const router = useRouter();

  const [members, setMembers] = useState<
    { userid: number; username: string }[]
  >([]);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<"food" | "travel" | "gifts" | "">(
    ""
  ); // Add category state
  const [paidBy, setPaidBy] = useState<string>("");

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [personal, setPersonal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/groups/getMembers/${groupId}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.members)) {
          setMembers(data.members);
          if (data.members.length > 0) setPaidBy(data.members[0].username);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [groupId]);

  const toggleSelect = (username: string) => {
    setSelected((p) => {
      const newValue = !p[username];
      // If unchecking, reset personal amount to 0
      if (!newValue) {
        setPersonal((prev) => ({ ...prev, [username]: "0" }));
      }
      return { ...p, [username]: newValue };
    });
  };

  const setPersonalAmount = (username: string, val: string) => {
    if (typeof val === "string" && val.trim().startsWith("-")) {
      alert("Negative amounts are not allowed");
      return;
    }
    setPersonal((p) => ({ ...p, [username]: val }));
  };

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    for (const m of members) next[m.username] = true;
    setSelected(next);
  };

  const isNumericString = (s: any) => {
    if (s === undefined || s === null) return false;
    const str = String(s).trim();
    if (str === "") return false;
    return /^\d+(?:\.\d+)?$/.test(str);
  };

  const distributeEqually = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) return alert("Enter valid amount");
    const selectedMembers = members.filter((m) => selected[m.username]);
    if (selectedMembers.length === 0) return alert("Select members first");

    let fixedAssigned = 0;
    const recipients: typeof selectedMembers = [] as any;
    for (const m of selectedMembers) {
      const val = personal[m.username];
      if (isNumericString(val) && Number(val) > 0) {
        fixedAssigned += Number(val);
      } else {
        recipients.push(m);
      }
    }

    const toDistribute = amt - fixedAssigned;
    if (toDistribute < 0) {
      alert("Invalid assignments");
      return;
    }
    if (recipients.length === 0) {
      return alert(
        "No members to distribute to (all selected members already have assigned amounts)"
      );
    }

    const equalShare = Number((toDistribute / recipients.length).toFixed(2));
    const next = { ...personal };
    for (const m of recipients) {
      next[m.username] = String(equalShare);
    }
    setPersonal(next);
  };

  const validateAndSubmit = async () => {
    const amtStr = String(amount).trim();
    if (!/^\d+(?:\.\d+)?$/.test(amtStr))
      return alert("Amount must be a number (integer or decimal)");
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt < 0) return alert("Enter valid amount");

    let assigned = 0;
    for (const m of members) {
      if (!selected[m.username]) continue;
      const v = personal[m.username];
      if (v === undefined || v === null || String(v).trim() === "") continue;
      if (!isNumericString(v))
        return alert(`Personal amount for ${m.username} must be numeric`);
      const num = Number(String(v).trim());
      if (num < 0)
        return alert(`Personal amount for ${m.username} cannot be negative`);
      assigned += num;
    }

    const paidByAssigned = 0;
    const diff = Math.abs(amt - assigned - paidByAssigned);
    if (diff > 5) {
      return alert(
        "Sum of assigned amounts is not within acceptable range of total amount"
      );
    }

    const shares: Array<{ username: string; amount: number }> = [];
    for (const m of members) {
      if (selected[m.username]) {
        const raw = personal[m.username];
        const v = isNumericString(raw) ? Number(String(raw).trim()) : 0;
        if (!isNaN(v) && v > 0)
          shares.push({ username: m.username, amount: v });
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          amount: amt,
          description,
          category: category || undefined, // Add category
          paidByUsername: paidBy,
          shares,
        }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to create expense");
      alert(data.message || "Expense created");
      router.push(`/groups/${groupId}`);
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const myUsername = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload: any = jwtDecode(token as string);
      return payload?.username ?? null;
    } catch (e) {
      return null;
    }
  }, []);

  const selectedCount = Object.values(selected).filter(Boolean).length;

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
                ADD EXPENSE
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
            {/* Amount */}
            <div>
              <label className="block text-xs tracking-widest text-gray-500 mb-3">
                AMOUNT
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 focus:border-white text-white placeholder-gray-600 focus:outline-none text-lg transition-colors duration-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs tracking-widest text-gray-500 mb-3">
                DESCRIPTION
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this expense for?"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 focus:border-white text-white placeholder-gray-600 focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs tracking-widest text-gray-500 mb-3">
                CATEGORY (OPTIONAL)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setCategory(category === "food" ? "" : "food")}
                  className={`px-6 py-3 text-sm uppercase tracking-wider transition-all duration-300 border ${
                    category === "food"
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-white hover:text-white"
                  }`}
                >
                  🍔 Food
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCategory(category === "travel" ? "" : "travel")
                  }
                  className={`px-6 py-3 text-sm uppercase tracking-wider transition-all duration-300 border ${
                    category === "travel"
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-white hover:text-white"
                  }`}
                >
                  ✈️ Travel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCategory(category === "gifts" ? "" : "gifts")
                  }
                  className={`px-6 py-3 text-sm uppercase tracking-wider transition-all duration-300 border ${
                    category === "gifts"
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-white hover:text-white"
                  }`}
                >
                  🎁 Gifts
                </button>
              </div>
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-xs tracking-widest text-gray-500 mb-3">
                PAID BY
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 focus:border-white text-white focus:outline-none transition-colors duration-200"
              >
                {members.map((m) => (
                  <option
                    key={m.userid}
                    value={m.username}
                    className="bg-[#0a0a0a]"
                  >
                    {m.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-xs tracking-widest text-gray-500">
                    SPLIT BETWEEN
                  </label>
                  {selectedCount > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {selectedCount} member{selectedCount !== 1 ? "s" : ""}{" "}
                      selected
                    </div>
                  )}
                </div>
                <div className="flex gap-4 text-xs tracking-wider">
                  <button
                    onClick={() => {
                      const next: Record<string, boolean> = {};
                      const pNext: Record<string, string> = { ...personal };
                      for (const m of members) {
                        next[m.username] = true;
                        pNext[m.username] = "0";
                      }
                      setSelected(next);
                      setPersonal(pNext);
                    }}
                    className="text-white hover:text-gray-400 transition-colors"
                  >
                    SELECT ALL
                  </button>
                  <button
                    onClick={() => {
                      setSelected({});
                      // Reset all personal amounts to 0 when clearing
                      const resetPersonal: Record<string, string> = {};
                      for (const m of members) {
                        resetPersonal[m.username] = "0";
                      }
                      setPersonal(resetPersonal);
                    }}
                    className="text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    CLEAR
                  </button>
                  <button
                    onClick={distributeEqually}
                    className="text-white hover:text-gray-400 transition-colors"
                  >
                    SPLIT EQUALLY
                  </button>
                </div>
              </div>

              <div className="border border-gray-800 bg-[#0a0a0a]">
                {members.map((m, idx) => (
                  <div
                    key={m.userid}
                    className={`p-4 flex items-center justify-between transition-colors duration-150 ${
                      idx !== members.length - 1
                        ? "border-b border-gray-800"
                        : ""
                    } ${
                      selected[m.username]
                        ? "bg-[#111111]"
                        : "hover:bg-[#0d0d0d]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={!!selected[m.username]}
                        onChange={() => toggleSelect(m.username)}
                        className="w-4 h-4 accent-white cursor-pointer"
                      />
                      <div>
                        <div className="text-sm tracking-wide text-white">
                          {m.username}
                        </div>
                        <div className="text-xs text-gray-600 tracking-wide">
                          ID: {m.userid}
                        </div>
                      </div>
                    </div>
                    <div>
                      {selected[m.username] && (
                        <input
                          value={personal[m.username] || ""}
                          onChange={(e) =>
                            setPersonalAmount(m.username, e.target.value)
                          }
                          className="w-32 px-3 py-2 bg-[#0a0a0a] border border-gray-800 focus:border-white text-white text-sm text-right focus:outline-none transition-colors duration-200"
                          placeholder="0.00"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              onClick={validateAndSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-white text-black hover:bg-gray-200 transition-all duration-300 tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"
            >
              {loading ? "ADDING..." : "ADD EXPENSE"}
            </button>
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-6 text-gray-600 text-xs tracking-wide">
          The expense will be split among the selected members
        </div>
      </div>
    </main>
  );
}
