import { connectDB } from "@/server/db";
import { Expense } from "@/server/models/expense";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const groupIdStr = resolvedParams?.groupId;
    const groupId = Number(groupIdStr);
    if (Number.isNaN(groupId))
      return new Response(JSON.stringify({ error: "invalid groupId" }), {
        status: 400,
      });

    await connectDB();
    // sum expenses.amount where groupId matches
    const res = await Expense.aggregate([
      { $match: { groupId: groupId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).exec();
    const total =
      Array.isArray(res) && res[0] && res[0].total ? res[0].total : 0;
    return new Response(JSON.stringify({ groupId, total }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
