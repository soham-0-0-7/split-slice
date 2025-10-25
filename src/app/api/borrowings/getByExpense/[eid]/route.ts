import { connectDB } from "@/server/db";
import { Borrowing } from "@/server/models/borrowing";
import { User } from "@/server/models/user";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const eidStr = resolvedParams?.eid;
    const eid = Number(eidStr);
    if (Number.isNaN(eid))
      return new Response(JSON.stringify({ error: "invalid eid" }), {
        status: 400,
      });

    await connectDB();
    const borrowings = await Borrowing.find({ expenseid: eid }).exec();
    // resolve userids to usernames
    const userIds = [
      ...new Set(borrowings.flatMap((b) => [b.lender, b.borrower])),
    ];
    const users = await User.find({ userid: { $in: userIds } })
      .select("userid username")
      .exec();
    const userMap: Record<number, string> = {};
    users.forEach((u) => (userMap[u.userid] = u.username));

    const out = borrowings.map((b) => ({
      bid: b.bid,
      lender: b.lender,
      lenderName: userMap[b.lender] ?? String(b.lender),
      borrower: b.borrower,
      borrowerName: userMap[b.borrower] ?? String(b.borrower),
      amount: b.amount,
    }));
    return new Response(JSON.stringify({ borrowings: out }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
