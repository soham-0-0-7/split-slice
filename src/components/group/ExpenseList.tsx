"use client";

import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function ExpenseList({
  groupid,
  isOwner,
  onDeleted,
}: {
  groupid: string;
  isOwner?: boolean;
  onDeleted?: () => void;
}) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openExpense, setOpenExpense] = useState<number | null>(null);
  const [borrowingsMap, setBorrowingsMap] = useState<Record<number, any[]>>({});

  const getCurrentUsername = () => {
    try {
      const raw = localStorage.getItem("token");
      if (!raw) return null;
      const p = jwtDecode<any>(raw);
      return p?.username ?? null;
    } catch (e) {
      return null;
    }
  };

  const deleteExpense = async (eid: number) => {
    if (!confirm("Delete this expense and create reverse settlements?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/expenses/delete/${eid}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to delete expense");
      // refresh
      const fres = await fetch(`/api/expenses/getExpenses/${groupid}`);
      const fdata = await fres.json();
      if (fres.ok)
        setExpenses(Array.isArray(fdata.expenses) ? fdata.expenses : []);
      alert("Expense deleted and reverse settlements created");
      // notify parent to refresh settlements/UI
      try {
        if (typeof onDeleted === "function") onDeleted();
      } catch (e) {
        // ignore
      }

      // do a hard reload so settlements (server-side) are visible without manual refresh
      try {
        window.location.reload();
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  };

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/expenses/getExpenses/${groupid}`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Failed to load expenses");
        setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      } catch (err: any) {
        alert(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [groupid]);

  return (
    <div className="relative">
      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-8">
          <div className="w-1 h-1 bg-gray-500 animate-pulse"></div>
          <div className="text-sm uppercase tracking-wider">
            Loading expenses...
          </div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-gray-600 text-sm uppercase tracking-wider">
            No expenses yet
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {expenses.map((e, idx) => (
            <div
              key={e.eid}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="border-l-2 border-transparent hover:border-white transition-all duration-300 
                       bg-[#1a1a1a] hover:bg-[#2a2a2a] animate-slideIn group"
            >
              <div className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-base mb-2 truncate">
                      {e.description ?? "-"}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 uppercase tracking-wide">
                      <span className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-600"></span>
                        {e.paidBy}
                      </span>
                      <span className="text-gray-700">•</span>
                      <span>{new Date(e.createdOn).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        ₹{e.amount}
                      </div>
                    </div>

                    {(isOwner || getCurrentUsername() === e.paidBy) && (
                      <button
                        onClick={() => deleteExpense(e.eid)}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-white uppercase 
                                 tracking-wider transition-colors duration-200 border border-gray-800 
                                 hover:border-white"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={async () => {
                      if (openExpense === e.eid) return setOpenExpense(null);
                      // fetch borrowings for this expense
                      if (!borrowingsMap[e.eid]) {
                        try {
                          const res = await fetch(
                            `/api/borrowings/getByExpense/${e.eid}`
                          );
                          const data = await res.json();
                          if (!res.ok)
                            return alert(
                              data.error || "Failed to load borrowings"
                            );
                          setBorrowingsMap((p) => ({
                            ...p,
                            [e.eid]: data.borrowings || [],
                          }));
                        } catch (err: any) {
                          alert(err?.message || String(err));
                        }
                      }
                      setOpenExpense(e.eid);
                    }}
                    className="text-xs text-gray-500 hover:text-white uppercase tracking-wider 
                             transition-colors duration-200 flex items-center gap-2"
                  >
                    <span
                      className="inline-block w-4 h-[1px] bg-gray-700 group-hover:bg-white 
                                   transition-colors duration-200"
                    ></span>
                    {openExpense === e.eid ? "Hide details" : "Show details"}
                  </button>
                </div>

                {openExpense === e.eid && (
                  <div className="mt-4 pt-4 border-t border-gray-800 animate-fadeIn">
                    <div className="text-xs text-gray-600 uppercase tracking-wider mb-3">
                      Borrowings
                    </div>
                    {!borrowingsMap[e.eid] ||
                    borrowingsMap[e.eid].length === 0 ? (
                      <div className="text-sm text-gray-600 italic">
                        No borrowings
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {borrowingsMap[e.eid].map((b: any, bidx: number) => (
                          <div
                            key={b.bid}
                            style={{ animationDelay: `${bidx * 30}ms` }}
                            className="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] 
                                     border-l border-gray-800 animate-slideIn"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-6 h-6 bg-gray-800 flex items-center justify-center 
                                            text-xs text-gray-500"
                              >
                                {b.borrowerName?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-400">
                                {b.borrowerName}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-white">
                              ₹{b.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {idx < expenses.length - 1 && (
                <div className="h-[1px] bg-gray-900 mx-6"></div>
              )}
            </div>
          ))}
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
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
