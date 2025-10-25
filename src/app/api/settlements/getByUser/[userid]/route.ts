import { connectDB } from "@/server/db";
import { Settlement, ISettlement } from "@/server/models/settlement";
import { User } from "@/server/models/user";

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

    await connectDB();
    // allow optional groupId filter via query param: ?groupId=123
    const url = new URL(req.url);
    const groupIdParam = url.searchParams.get("groupId");
    const groupIdFilter = groupIdParam !== null ? Number(groupIdParam) : null;
    if (groupIdParam !== null && Number.isNaN(groupIdFilter))
      return new Response(JSON.stringify({ error: "invalid groupId" }), {
        status: 400,
      });

    const query: any = { $or: [{ payee: userid }, { receiver: userid }] };
    if (groupIdFilter !== null) query.groupId = groupIdFilter;

    let settles = await Settlement.find(query).sort({ createdOn: -1 }).exec();
    // filter out self-settlements where payee === receiver
    settles = settles.filter((s: ISettlement) => s.payee !== s.receiver);
    const otherIds = settles.map((s: ISettlement) =>
      s.payee === userid ? s.receiver : s.payee
    );
    const others = await User.find({ userid: { $in: otherIds } })
      .select("userid username")
      .exec();
    const map = new Map(others.map((o) => [o.userid, o.username]));
    const out = settles.map((s: ISettlement) => ({
      sid: s.sid,
      payee: s.payee,
      receiver: s.receiver,
      amount: s.amount,
      createdOn: s.createdOn,
      payeeName: map.get(s.payee) ?? String(s.payee),
      receiverName: map.get(s.receiver) ?? String(s.receiver),
      userid,
    }));
    return new Response(JSON.stringify({ settlements: out }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
