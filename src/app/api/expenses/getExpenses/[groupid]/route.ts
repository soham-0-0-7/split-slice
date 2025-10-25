import { connectDB } from "@/server/db";
import { Expense } from "@/server/models/expense";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const groupIdStr = resolvedParams?.groupid;
    const groupId = Number(groupIdStr);
    if (Number.isNaN(groupId))
      return new Response(JSON.stringify({ error: "invalid groupid" }), {
        status: 400,
      });

    await connectDB();
    const expenses = await Expense.find({ groupId })
      .sort({ createdOn: -1 })
      .exec();
    // resolve paidBy userids to usernames
    const userIds = [...new Set(expenses.map((e) => e.paidBy))];
    const users = await (
      await import("@/server/models/user")
    ).User.find({ userid: { $in: userIds } })
      .select("userid username")
      .exec();
    const userMap: Record<number, string> = {};
    users.forEach((u: any) => (userMap[u.userid] = u.username));

    const out = expenses.map((e) => ({
      eid: e.eid,
      paidBy: userMap[e.paidBy] ?? e.paidBy,
      amount: e.amount,
      description: e.description,
      createdOn: e.createdOn,
    }));
    return new Response(JSON.stringify({ expenses: out }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
