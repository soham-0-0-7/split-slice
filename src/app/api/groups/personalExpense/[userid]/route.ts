import { connectDB } from "@/server/db";
import { Borrowing } from "@/server/models/borrowing";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const useridStr = resolvedParams?.userid;
    const userid = Number(useridStr);
    if (Number.isNaN(userid))
      return new Response(JSON.stringify({ error: "invalid userid" }), {
        status: 400,
      });

    // optional groupId query param
    const url = new URL(req.url);
    const groupIdParam = url.searchParams.get("groupId");
    const groupId = groupIdParam !== null ? Number(groupIdParam) : null;
    if (groupIdParam !== null && Number.isNaN(groupId))
      return new Response(JSON.stringify({ error: "invalid groupId" }), {
        status: 400,
      });

    await connectDB();
    const match: any = { borrower: userid };
    if (groupId !== null) match.groupId = groupId;

    const res = await Borrowing.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).exec();
    const total =
      Array.isArray(res) && res[0] && res[0].total ? res[0].total : 0;
    return new Response(JSON.stringify({ userid, groupId, total }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
