import { connectDB } from "@/server/db";
import { Group } from "@/server/models/group";
import { Settlement } from "@/server/models/settlement";
import { Expense } from "@/server/models/expense";
import { Borrowing } from "@/server/models/borrowing";
import { User } from "@/server/models/user";
import verifyTokenFromHeader from "@/server/middleware/verifyToken";

export async function DELETE(req: Request, context: any) {
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

    await connectDB();
    const group = await Group.findOne({ groupid }).exec();
    if (!group)
      return new Response(JSON.stringify({ error: "group not found" }), {
        status: 404,
      });

    // only owner can delete
    if (group.owner !== actorUserid)
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      });

    // check if any settlements exist for this group
    // consider settlements that were created before groupId was tracked: if both parties are members
    const memberIds = Array.isArray(group.members) ? group.members : [];
    const anySettle = await Settlement.findOne({
      $or: [
        { groupId: groupid },
        {
          groupId: { $exists: false },
          payee: { $in: memberIds },
          receiver: { $in: memberIds },
        },
      ],
    }).exec();
    if (anySettle)
      return new Response(
        JSON.stringify({
          error: "not everyone is settled in the group; cannot delete group",
        }),
        { status: 400 }
      );

    // delete expenses and borrowings for group
    await Expense.deleteMany({ groupId: groupid }).exec();
    await Borrowing.deleteMany({ groupId: groupid }).exec();

    // remove group reference from users.groups if exists
    await User.updateMany(
      { groups: groupid },
      { $pull: { groups: groupid } }
    ).exec();

    // finally delete the group
    await Group.deleteOne({ groupid }).exec();

    return new Response(JSON.stringify({ message: "group deleted" }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
