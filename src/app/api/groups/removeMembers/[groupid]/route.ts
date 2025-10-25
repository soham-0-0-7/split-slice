import { connectDB } from "@/server/db";
import { Group } from "@/server/models/group";
import { User } from "@/server/models/user";
import { Settlement } from "@/server/models/settlement";
import verifyTokenFromHeader from "@/server/middleware/verifyToken";

export async function PATCH(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const groupidStr = resolvedParams?.groupid;
    const groupid = Number(groupidStr);
    if (Number.isNaN(groupid))
      return new Response(JSON.stringify({ error: "invalid groupid" }), {
        status: 400,
      });

    const auth = req.headers.get("authorization") ?? undefined;
    const payload = verifyTokenFromHeader(auth as string | undefined) as any;
    const actorUserid = payload?.userid;

    const body = await req.json();
    const { username, userid } = body as { username?: string; userid?: number };
    if ((!username && typeof userid !== "number") || (!username && !userid)) {
      return new Response(
        JSON.stringify({ error: "username or userid required" }),
        { status: 400 }
      );
    }

    await connectDB();
    const group = await Group.findOne({ groupid }).exec();
    if (!group)
      return new Response(JSON.stringify({ error: "group not found" }), {
        status: 404,
      });

    // only owner can remove
    if (group.owner !== actorUserid)
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      });

    // resolve userid if username provided
    let targetUserid = userid;
    if (!targetUserid) {
      const u = await User.findOne({ username }).select("userid").exec();
      if (!u)
        return new Response(JSON.stringify({ error: "user not found" }), {
          status: 404,
        });
      targetUserid = u.userid;
    }

    // check settlements for this user with the same group
    // also consider legacy settlements without groupId but between group members
    const memberIds = Array.isArray(group.members) ? group.members : [];
    const anySettle = await Settlement.findOne({
      $or: [
        {
          groupId: groupid,
          $or: [{ payee: targetUserid }, { receiver: targetUserid }],
        },
        {
          groupId: { $exists: false },
          $or: [
            { payee: targetUserid, receiver: { $in: memberIds } },
            { receiver: targetUserid, payee: { $in: memberIds } },
          ],
        },
      ],
    }).exec();
    if (anySettle)
      return new Response(
        JSON.stringify({
          error: "user has pending settlements in this group; cannot remove",
        }),
        { status: 400 }
      );

    // also block removal if this user has any borrowings in the group (active debts)
    const { Borrowing } = await import("@/server/models/borrowing");
    const bor = await Borrowing.findOne({
      groupId: groupid,
      $or: [{ lender: targetUserid }, { borrower: targetUserid }],
    }).exec();
    if (bor)
      return new Response(
        JSON.stringify({
          error: "user has borrowings in this group; cannot remove",
        }),
        { status: 400 }
      );

    // block removal if the user created any expenses in this group (paidBy)
    const { Expense } = await import("@/server/models/expense");
    const exp = await Expense.findOne({
      groupId: groupid,
      paidBy: targetUserid,
    }).exec();
    if (exp)
      return new Response(
        JSON.stringify({
          error: "user has expenses in this group; cannot remove",
        }),
        { status: 400 }
      );

    // remove from group members
    if (!group.members.includes(targetUserid))
      return new Response(JSON.stringify({ error: "user not a member" }), {
        status: 400,
      });
    group.members = group.members.filter((id) => id !== targetUserid);
    await group.save();

    // remove from user's groups array if exists
    await User.updateOne(
      { userid: targetUserid },
      { $pull: { groups: groupid } }
    ).exec();

    return new Response(JSON.stringify({ message: "member removed" }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
