import { connectDB } from "@/server/db";
import { Expense } from "@/server/models/expense";
import { Borrowing } from "@/server/models/borrowing";
import { User } from "@/server/models/user";
import { Settlement } from "@/server/models/settlement";
import { computeOptimizedSettlements } from "@/server/utils/settlement";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupId, amount, description, category, paidByUsername, shares } =
      body as {
        groupId?: number;
        amount?: number;
        description?: string;
        category?: "food" | "travel" | "gifts";
        paidByUsername?: string;
        shares?: Array<{ username: string; amount: number }>;
      };

    if (
      groupId === undefined ||
      amount === undefined ||
      !paidByUsername ||
      !Array.isArray(shares)
    ) {
      return new Response(
        JSON.stringify({
          error: "groupId, amount, paidByUsername and shares required",
        }),
        { status: 400 }
      );
    }

    if (typeof amount === "number" && amount < 0) {
      return new Response(
        JSON.stringify({ error: "Amount cannot be negative" }),
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !["food", "travel", "gifts"].includes(category)) {
      return new Response(
        JSON.stringify({
          error: "Invalid category. Must be: food, travel, or gifts",
        }),
        { status: 400 }
      );
    }

    await connectDB();

    // Resolve payer
    const payer = await User.findOne({ username: paidByUsername }).exec();
    if (!payer)
      return new Response(JSON.stringify({ error: "paidBy user not found" }), {
        status: 404,
      });

    const gid = Number(groupId);
    if (Number.isNaN(gid))
      return new Response(JSON.stringify({ error: "invalid groupId" }), {
        status: 400,
      });

    // Create Expense (with groupId)
    const expense = new Expense({
      paidBy: payer.userid,
      amount,
      description,
      groupId: gid,
      category: category || undefined,
    });
    await expense.save();

    console.log(
      "✅ Expense saved with groupId:",
      gid,
      "and category:",
      category || "none"
    );

    // Sequentially save borrowings (guaranteed to persist groupId)
    const newBorrowings: Array<{
      borrower: number;
      lender: number;
      amount: number;
    }> = [];

    for (const s of shares) {
      if (!s.username || s.amount === undefined) continue;
      if (typeof s.amount === "number" && s.amount < 0) {
        return new Response(
          JSON.stringify({
            error: `Share amount for ${s.username} cannot be negative`,
          }),
          { status: 400 }
        );
      }

      const u = await User.findOne({ username: s.username }).exec();
      if (!u) continue;
      if (!s.amount || Number(s.amount) === 0) continue;

      const borrowing = new Borrowing({
        lender: payer.userid,
        borrower: u.userid,
        amount: s.amount,
        expenseid: expense.eid,
        groupId: gid,
      });

      console.log("📘 Saving Borrowing with groupId:", gid);
      await borrowing.save();

      newBorrowings.push({
        borrower: u.userid,
        lender: payer.userid,
        amount: s.amount,
      });
    }

    // Fetch existing pending settlements for the same group
    const existingSettlements = await Settlement.find({ groupId: gid }).exec();

    const debts: Array<[string, string, number]> = [];
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

    const userMap: Record<number, string> = {};
    users.forEach((u) => (userMap[u.userid] = u.username));

    // Convert all settlements + new borrowings to [payer, receiver, amount]
    for (const s of existingSettlements) {
      debts.push([
        userMap[s.payee] ?? String(s.payee),
        userMap[s.receiver] ?? String(s.receiver),
        s.amount,
      ]);
    }

    for (const b of newBorrowings) {
      debts.push([
        userMap[b.borrower] ?? String(b.borrower),
        userMap[b.lender] ?? String(b.lender),
        b.amount,
      ]);
    }

    // Compute optimized settlements
    const optimized = computeOptimizedSettlements(debts as any);

    console.log("💡 Optimized settlements:", optimized);

    // Replace existing settlements for this group with the optimized list
    // Delete existing group settlements first (atomic replace semantics)
    try {
      await Settlement.deleteMany({ groupId: gid }).exec();
      console.log("🧹 Cleared existing settlements for group:", gid);
    } catch (e) {
      console.warn("Could not clear existing settlements for group", gid, e);
    }

    for (const t of optimized) {
      const [payerName, receiverName, amtSet] = t;
      const payerUser = await User.findOne({ username: payerName })
        .select("userid")
        .exec();
      const receiverUser = await User.findOne({ username: receiverName })
        .select("userid")
        .exec();

      if (!payerUser || !receiverUser) continue;
      if (payerUser.userid === receiverUser.userid) continue;

      const settlement = new Settlement({
        payee: payerUser.userid,
        receiver: receiverUser.userid,
        amount: amtSet,
        groupId: gid,
      });

      console.log("💰 Saving Settlement with groupId:", gid);
      await settlement.save();
    }

    return new Response(
      JSON.stringify({
        message: "Expense created successfully",
        expenseId: expense.eid,
      }),
      { status: 201 }
    );
  } catch (err: any) {
    console.error(" Error in expense creation:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
