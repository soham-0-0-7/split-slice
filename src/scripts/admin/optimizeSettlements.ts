import { connectDB } from "@/server/db";
import { Settlement } from "@/server/models/settlement";
import { User } from "@/server/models/user";
import { computeOptimizedSettlements } from "@/server/utils/settlement";

// Expose optimization logic as an exported function for admin/scripts usage.
export async function computeOptimizedForGroup(opts: {
  actorAuthHeader?: string | undefined;
  actorUserid?: number | undefined; // optional, not enforced here
  groupId: number;
  newBorrowings: Array<{ borrower: number; lender: number; amount: number }>;
}) {
  const { groupId, newBorrowings } = opts;
  await connectDB();

  const existingSettlements = await Settlement.find({
    groupId,
  }).exec();

  const userIds = new Set<number>();
  for (const s of existingSettlements) {
    userIds.add(s.payee);
    userIds.add(s.receiver);
  }
  for (const b of newBorrowings) {
    userIds.add(b.borrower);
    userIds.add(b.lender);
  }

  const users = await User.find({ userid: { $in: Array.from(userIds) } })
    .select("userid username")
    .exec();
  const idToName: Record<number, string> = {};
  users.forEach((u) => (idToName[u.userid] = u.username));

  const debts: Array<[string, string, number]> = [];
  for (const s of existingSettlements) {
    debts.push([
      idToName[s.payee] ?? String(s.payee),
      idToName[s.receiver] ?? String(s.receiver),
      s.amount,
    ]);
  }
  for (const b of newBorrowings) {
    debts.push([
      idToName[b.borrower] ?? String(b.borrower),
      idToName[b.lender] ?? String(b.lender),
      b.amount,
    ]);
  }

  const optimized = computeOptimizedSettlements(debts);
  return optimized;
}
