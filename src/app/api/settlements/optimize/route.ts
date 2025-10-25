import { connectDB } from "@/server/db";
import verifyTokenFromHeader from "@/server/middleware/verifyToken";
import { Settlement } from "@/server/models/settlement";
import { User } from "@/server/models/user";
import { computeOptimizedSettlements } from "@/server/utils/settlement";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") ?? undefined;
    const payload = verifyTokenFromHeader(auth as string | undefined) as any;
    const userid = payload?.userid;
    if (!userid)
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
      });

    const body = await req.json();
    // body: { groupId: number, newBorrowings: [{ borrowerUserid, lenderUserid, amount }] }
    const { groupId, newBorrowings } = body as {
      groupId?: number;
      newBorrowings?: Array<{
        borrower: number;
        lender: number;
        amount: number;
      }>;
    };
    if (groupId === undefined || !Array.isArray(newBorrowings)) {
      return new Response(
        JSON.stringify({ error: "groupId and newBorrowings required" }),
        { status: 400 }
      );
    }

    await connectDB();

    // fetch existing settlements for this user within the group (either as payee or receiver)
    const existingSettlements = await Settlement.find({
      groupId,
      $or: [{ payee: userid }, { receiver: userid }],
    }).exec();

    // convert existing settlements and new borrowings into debts array of [payerName, receiverName, amount]
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
    return new Response(JSON.stringify({ optimized }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
