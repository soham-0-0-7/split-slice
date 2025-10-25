import { connectDB } from "@/server/db";
import { Expense } from "@/server/models/expense";
import { Borrowing } from "@/server/models/borrowing";
import { Settlement } from "@/server/models/settlement";
import verifyTokenFromHeader from "@/server/middleware/verifyToken";

export async function DELETE(req: Request, context: any) {
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

    const auth = req.headers.get("authorization") ?? undefined;
    const payload = verifyTokenFromHeader(auth as string | undefined) as any;
    const actorUserid = payload?.userid;

    await connectDB();
    const expense = await Expense.findOne({ eid }).exec();
    if (!expense)
      return new Response(JSON.stringify({ error: "expense not found" }), {
        status: 404,
      });

    // fetch group via expense.groupId (may be undefined for legacy expenses)
    let groupId = (expense as any).groupId;

    // if groupId is undefined, try infer from borrowings (if all borrowings share same groupId)
    const borrowings = await Borrowing.find({ expenseid: eid }).exec();
    if (!groupId) {
      const gids = new Set<number>();
      for (const b of borrowings)
        if ((b as any).groupId) gids.add((b as any).groupId);
      if (gids.size === 1) groupId = Array.from(gids)[0];
    }

    // permission: only group owner or the expense.paidBy can delete
    if (groupId) {
      const { Group } = await import("@/server/models/group");
      const g = await Group.findOne({ groupid: groupId }).exec();
      const isOwner = g ? g.owner === actorUserid : false;
      if (!(isOwner || (expense as any).paidBy === actorUserid))
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
        });
    } else {
      // legacy: allow only paidBy to delete if group unknown
      if ((expense as any).paidBy !== actorUserid)
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
        });
    }
    // borrowings already fetched above
    const settleSaves: any[] = [];
    for (const b of borrowings) {
      // borrowing: borrower owes lender; reverse settlement: lender pays borrower
      // skip trivial self-settlements
      if (b.lender === b.borrower) continue;
      const sdoc = new Settlement({
        payee: b.lender,
        receiver: b.borrower,
        amount: b.amount,
        groupId: groupId ?? undefined,
      });
      settleSaves.push(sdoc.save());
    }
    await Promise.all(settleSaves);

    // delete borrowings and expense
    await Borrowing.deleteMany({ expenseid: eid }).exec();
    await Expense.deleteOne({ eid }).exec();

    return new Response(
      JSON.stringify({
        message: "expense deleted and reverse settlements added",
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
