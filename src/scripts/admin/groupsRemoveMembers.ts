import { connectDB } from "@/server/db";
import { Group } from "@/server/models/group";
import { User } from "@/server/models/user";
import { Settlement } from "@/server/models/settlement";
import verifyTokenFromHeader from "@/server/middleware/verifyToken";

// This is a slip-and-run copy of the logic previously exposed as a public route.
// It accepts the same semantic inputs but is exported for admin/script usage.
export async function removeMemberFromGroup(opts: {
  actorAuthHeader?: string | undefined;
  groupid: number;
  targetUsername?: string;
  targetUserid?: number;
}) {
  const { actorAuthHeader, groupid, targetUsername, targetUserid } = opts;

  await connectDB();

  const payload = verifyTokenFromHeader(
    actorAuthHeader as string | undefined
  ) as any;
  const actorUserid = payload?.userid;

  if (!actorUserid) throw new Error("unauthorized");

  const group = await Group.findOne({ groupid }).exec();
  if (!group) throw new Error("group not found");

  if (group.owner !== actorUserid) throw new Error("unauthorized");

  let targetUseridResolved = targetUserid;
  if (!targetUseridResolved && targetUsername) {
    const u = await User.findOne({ username: targetUsername })
      .select("userid")
      .exec();
    if (!u) throw new Error("user not found");
    targetUseridResolved = u.userid;
  }
  if (!targetUseridResolved) throw new Error("username or userid required");

  // check settlements for this user with the same group
  const memberIds = Array.isArray(group.members) ? group.members : [];
  const anySettle = await Settlement.findOne({
    $or: [
      {
        groupId: groupid,
        $or: [
          { payee: targetUseridResolved },
          { receiver: targetUseridResolved },
        ],
      },
      {
        groupId: { $exists: false },
        $or: [
          { payee: targetUseridResolved, receiver: { $in: memberIds } },
          { receiver: targetUseridResolved, payee: { $in: memberIds } },
        ],
      },
    ],
  }).exec();
  if (anySettle)
    throw new Error(
      "user has pending settlements in this group; cannot remove"
    );

  const { Borrowing } = await import("@/server/models/borrowing");
  const bor = await Borrowing.findOne({
    groupId: groupid,
    $or: [{ lender: targetUseridResolved }, { borrower: targetUseridResolved }],
  }).exec();
  if (bor) throw new Error("user has borrowings in this group; cannot remove");

  const { Expense } = await import("@/server/models/expense");
  const exp = await Expense.findOne({
    groupId: groupid,
    paidBy: targetUseridResolved,
  }).exec();
  if (exp) throw new Error("user has expenses in this group; cannot remove");

  if (!group.members.includes(targetUseridResolved))
    throw new Error("user not a member");
  group.members = group.members.filter((id) => id !== targetUseridResolved);
  await group.save();

  await User.updateOne(
    { userid: targetUseridResolved },
    { $pull: { groups: groupid } }
  ).exec();

  return { message: "member removed" };
}
