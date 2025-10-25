"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useUser } from "@/context/UserContext";
import ExpenseList from "@/components/group/ExpenseList";
import MembersList from "@/components/group/MembersList";

export default function GroupDetailsPage({
  params,
}: {
  params: Promise<{ groupid: string }>;
}) {
  const resolvedParams = React.use(params);
  const groupid = resolvedParams.groupid;
  const [groupName, setGroupName] = useState<string>("Group");
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [groupMeta, setGroupMeta] = useState<any | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [groupSettlements, setGroupSettlements] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [groupTotal, setGroupTotal] = useState<number | null>(null);
  const [personalTotal, setPersonalTotal] = useState<number | null>(null);
  const { friendlist } = useUser();
  const [friendUsernames, setFriendUsernames] = useState<string[]>([]);
  const searchParams = useSearchParams();

  const router = useRouter();

  const tab = searchParams?.get("tab") || "expenses";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/groups/getMembers/${groupid}`);
        const data = await res.json();
        if (res.ok) {
          setGroupName(data.groupname ?? "Group");
          setTotalMembers(data.total ?? data.members.length ?? null);
        }

        const metaRes = await fetch(`/api/groups/get/${groupid}`);
        const meta = await metaRes.json();
        if (metaRes.ok && meta?.group) {
          setGroupMeta(meta.group);
        }

        const token = localStorage.getItem("token");
        if (token) {
          const payload: any = jwtDecode(token as string);
          const userid = payload?.userid;
          if (Array.isArray(data.members)) {
            const memberIds = data.members.map((m: any) => m.userid);
            const memberCheck = memberIds.includes(userid);
            setIsMember(memberCheck);
          }
          if (meta?.group) {
            setIsOwner(userid === meta.group.owner);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();

    const loadSettlements = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const payload: any = jwtDecode(token as string);
        const userid = payload?.userid;
        if (!userid) return;
        const res = await fetch(
          `/api/settlements/getByUser/${userid}?groupId=${groupid}`
        );
        const data = await res.json();
        if (res.ok)
          setSettlements(
            Array.isArray(data.settlements) ? data.settlements : []
          );
      } catch (e) {
        console.error(e);
      }
    };
    loadSettlements();

    const loadGroupSettlements = async () => {
      try {
        const res = await fetch(`/api/settlements/getByGroup/${groupid}`);
        const data = await res.json();
        if (res.ok) {
          const arr = Array.isArray(data.settlements) ? data.settlements : [];
          const idsSet = new Set<number>();
          for (const s of arr) {
            idsSet.add(Number(s.payee));
            idsSet.add(Number(s.receiver));
          }
          const ids = Array.from(idsSet);
          let idToName: Record<number, string> = {};
          if (ids.length > 0) {
            try {
              const r = await fetch(`/api/users/byIds`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
              });
              const jd = await r.json();
              if (r.ok && Array.isArray(jd.users)) {
                jd.users.forEach(
                  (u: any) => (idToName[Number(u.userid)] = u.username)
                );
              }
            } catch (e) {}
          }

          const annotated = arr.map((s: any) => ({
            ...s,
            payeeName: idToName[Number(s.payee)] ?? String(s.payee),
            receiverName: idToName[Number(s.receiver)] ?? String(s.receiver),
          }));
          setGroupSettlements(annotated);

          const map: Record<number, number> = {};
          for (const s of annotated) {
            const payee = Number(s.payee);
            const receiver = Number(s.receiver);
            const amt = Number(s.amount) || 0;
            map[payee] = (map[payee] || 0) - amt;
            map[receiver] = (map[receiver] || 0) + amt;
          }
          const out: Record<string, number> = {};
          Object.keys(map).forEach((k) => {
            out[String(k)] = map[Number(k)];
          });
          setBalances(out);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadGroupSettlements();

    const loadTotals = async () => {
      try {
        const gRes = await fetch(`/api/groups/groupExpenses/${groupid}`);
        if (gRes.ok) {
          const gData = await gRes.json();
          setGroupTotal(
            typeof gData.total === "number"
              ? gData.total
              : Number(gData.total) || 0
          );
        } else {
          setGroupTotal(0);
        }

        const token = localStorage.getItem("token");
        if (!token) return;
        const payload: any = jwtDecode(token as string);
        const userid = payload?.userid;
        if (!userid) return;
        const pRes = await fetch(
          `/api/groups/personalExpense/${userid}?groupId=${groupid}`
        );
        if (pRes.ok) {
          const pData = await pRes.json();
          setPersonalTotal(
            typeof pData.total === "number"
              ? pData.total
              : Number(pData.total) || 0
          );
        } else {
          setPersonalTotal(0);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadTotals();

    const loadFriendUsernames = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const payload: any = jwtDecode(token as string);
        const myUsername = payload?.username ?? null;
        const userid = payload?.userid ?? null;

        let names: string[] = [];
        if (Array.isArray(friendlist) && friendlist.length > 0) {
          const res = await fetch(`/api/users/byIds`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: friendlist }),
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data.users)) {
            names = data.users.map((u: any) => String(u.username));
          }
        } else if (userid) {
          const res = await fetch(`/api/users/friends/${userid}`);
          const data = await res.json();
          if (res.ok && Array.isArray(data.users)) {
            names = data.users.map((u: any) => String(u.username));
          }
        }

        if (myUsername && !names.includes(myUsername)) names.push(myUsername);
        setFriendUsernames(names);
      } catch (e) {
        console.error(e);
      }
    };
    loadFriendUsernames();
  }, [groupid]);

  useEffect(() => {
    const loadNames = async () => {
      try {
        const ids = Object.keys(balances)
          .map((k) => Number(k))
          .filter((n) => !Number.isNaN(n));
        if (ids.length === 0) return;
        const res = await fetch(`/api/users/byIds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.users)) return;

        const idToName: Record<string, string> = {};
        for (const u of data.users) idToName[String(u.userid)] = u.username;

        const newBalances: Record<string, number> = {};
        Object.entries(balances).forEach(([k, v]) => {
          const name = idToName[k] ?? k;
          newBalances[name] = v;
        });
        setBalances(newBalances);
      } catch (e) {}
    };
    loadNames();
  }, [balances]);

  if (isMember === null) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-lg tracking-wide animate-pulse">
          LOADING...
        </div>
      </main>
    );
  }

  if (!isMember) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-gray-300 text-2xl font-light tracking-wider">
            UNAUTHORIZED
          </div>
          <div className="text-gray-500 text-sm">
            You are not a member of this group
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-6 py-2 border border-gray-700 text-gray-300 hover:bg-white hover:text-black transition-all duration-300 tracking-wider text-sm"
          >
            ← BACK TO DASHBOARD
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            {/* Left: Group Info */}
            <div className="flex-1">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-500 hover:text-gray-300 transition-colors duration-200 text-sm tracking-wider mb-6 inline-flex items-center gap-2"
              >
                ← BACK TO DASHBOARD
              </button>

              <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-2 break-words">
                {groupName.toUpperCase()}
              </h1>
              <div className="h-1 w-20 bg-white mb-6"></div>

              <div className="space-y-2 text-sm tracking-wide">
                <div className="text-gray-500">
                  GROUP ID: <span className="text-gray-400">{groupid}</span>
                </div>
                <div className="text-gray-500">
                  MEMBERS:{" "}
                  <span className="text-gray-400">{totalMembers ?? "-"}</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-gray-600 tracking-widest mb-1">
                    GROUP TOTAL
                  </div>
                  <div className="text-2xl font-light tracking-tight">
                    ₹{groupTotal ?? "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 tracking-widest mb-1">
                    YOUR SHARE
                  </div>
                  <div className="text-2xl font-light tracking-tight">
                    ₹{personalTotal ?? "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Settlements & Actions */}
            <div className="w-full lg:w-96 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs tracking-widest text-gray-500">
                  QUICK ACTIONS
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/groups/${groupid}/createExp`)}
                    className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 transition-all duration-300 text-xs tracking-wider"
                  >
                    ADD EXPENSE
                  </button>
                  {groupMeta && (!groupMeta.ownersAddOnly || isOwner) && (
                    <button
                      onClick={() =>
                        router.push(`/groups/${groupid}/addMembers`)
                      }
                      className="px-3 py-1.5 border border-gray-700 text-gray-300 hover:bg-gray-900 transition-all duration-300 text-xs tracking-wider"
                    >
                      ADD MEMBERS
                    </button>
                  )}
                </div>
              </div>

              {/* Group Settlements */}
              <div className="border border-gray-800 bg-[#111111]">
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="text-xs tracking-widest text-gray-500">
                    GROUP SETTLEMENTS
                  </div>
                </div>
                <div className="h-36 overflow-auto">
                  {groupSettlements.length === 0 ? (
                    <div className="p-4 text-sm text-gray-600">
                      No settlements yet
                    </div>
                  ) : (
                    <ul>
                      {groupSettlements.map((s) => (
                        <li
                          key={s.sid}
                          className="px-4 py-3 border-b border-gray-800 last:border-b-0 text-sm"
                        >
                          <span className="text-gray-400">
                            {s.payeeName || s.payee}
                          </span>
                          {" → "}
                          <span className="text-gray-400">
                            {s.receiverName || s.receiver}
                          </span>
                          <span className="text-white ml-2">₹{s.amount}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Balances */}
              <div className="border border-gray-800 bg-[#111111]">
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="text-xs tracking-widest text-gray-500">
                    BALANCES
                  </div>
                </div>
                <div className="h-40 overflow-auto">
                  {Object.keys(balances).length === 0 ? (
                    <div className="p-4 text-sm text-gray-600">No balances</div>
                  ) : (
                    <ul>
                      {Object.entries(balances).map(([useridKey, bal]) => (
                        <li
                          key={useridKey}
                          className="px-4 py-2 border-b border-gray-800 last:border-b-0 flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-300">
                            {useridKey}
                          </span>
                          {bal >= 0 ? (
                            <span className="text-sm text-white">+₹{bal}</span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              -₹{Math.abs(bal)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="flex flex-wrap gap-4 sm:gap-8 border-b border-gray-800 mb-8">
          <button
            className={`pb-4 text-sm tracking-widest transition-all duration-300 ${
              tab === "expenses"
                ? "text-white border-b-2 border-white"
                : "text-gray-600 hover:text-gray-400"
            }`}
            onClick={() => router.push(`/groups/${groupid}?tab=expenses`)}
          >
            EXPENSES
          </button>

          <button
            className={`pb-4 text-sm tracking-widest transition-all duration-300 ${
              tab === "members"
                ? "text-white border-b-2 border-white"
                : "text-gray-600 hover:text-gray-400"
            }`}
            onClick={() => router.push(`/groups/${groupid}?tab=members`)}
          >
            MEMBERS
          </button>

          <button
            className={`pb-4 text-sm tracking-widest transition-all duration-300 ${
              tab === "settlements"
                ? "text-white border-b-2 border-white"
                : "text-gray-600 hover:text-gray-400"
            }`}
            onClick={() => router.push(`/groups/${groupid}?tab=settlements`)}
          >
            YOUR SETTLEMENTS
          </button>
        </div>

        <div>
          {tab === "expenses" ? (
            <ExpenseList groupid={groupid} isOwner={isOwner} />
          ) : tab === "members" ? (
            <MembersList
              groupid={groupid}
              friendUsernames={friendUsernames}
              isOwner={isOwner}
            />
          ) : tab === "settlements" ? (
            <div>
              <div className="border border-gray-800 bg-[#111111]">
                {settlements.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    No settlements found
                  </div>
                ) : (
                  <ul>
                    {settlements.map((s) => (
                      <li
                        key={s.sid}
                        className="p-6 border-b border-gray-800 last:border-b-0 flex items-center justify-between hover:bg-[#0d0d0d] transition-colors duration-150"
                      >
                        <div className="text-sm">
                          {s.receiver === s.userid ? (
                            <div>
                              <span className="text-gray-400">
                                {s.payeeName}
                              </span>
                              <span className="text-gray-600 mx-2">
                                will pay you
                              </span>
                              <span className="text-white">₹{s.amount}</span>
                            </div>
                          ) : s.payee === s.userid ? (
                            <div>
                              <span className="text-gray-600">You owe</span>
                              <span className="text-white mx-2">
                                ₹{s.amount}
                              </span>
                              <span className="text-gray-600">to</span>
                              <span className="text-gray-400 ml-2">
                                {s.receiverName}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-gray-600">Settlement</span>
                              <span className="text-white ml-2">
                                ₹{s.amount}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          className="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-white hover:text-black transition-all duration-300 text-xs tracking-wider"
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `/api/settlements/${s.sid}`,
                                {
                                  method: "DELETE",
                                }
                              );
                              if (!res.ok) throw new Error("failed");
                              const token = localStorage.getItem("token");
                              if (!token) return router.refresh();
                              const payload: any = jwtDecode(token as string);
                              const userid = payload?.userid;
                              if (!userid) return router.refresh();
                              const r2 = await fetch(
                                `/api/settlements/getByUser/${userid}`
                              );
                              const d2 = await r2.json();
                              if (r2.ok)
                                setSettlements(
                                  Array.isArray(d2.settlements)
                                    ? d2.settlements
                                    : []
                                );
                            } catch (e) {
                              alert("Could not mark settled");
                            }
                          }}
                        >
                          MARK SETTLED
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Other tab</div>
          )}
        </div>
      </div>
    </main>
  );
}
