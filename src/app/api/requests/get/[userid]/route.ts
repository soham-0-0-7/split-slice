import { connectDB } from "@/server/db";
import { FriendRequest } from "@/server/models/friendRequest";
import { User } from "@/server/models/user";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const useridStr = resolvedParams?.userid;
    const useridNum = Number(useridStr);
    if (Number.isNaN(useridNum))
      return new Response(JSON.stringify({ error: "invalid userid" }), {
        status: 400,
      });

    await connectDB();
    const user = await User.findOne({ userid: useridNum }).exec();
    if (!user)
      return new Response(JSON.stringify({ error: "userid does not exist" }), {
        status: 404,
      });

    const requests = await FriendRequest.find({
      $or: [{ from: useridNum }, { to: useridNum }],
    }).exec();
    // map to { rid, username, status }
    const otherUserIds = requests.map((r) =>
      r.from === useridNum ? r.to : r.from
    );
    const others = await User.find({ userid: { $in: otherUserIds } })
      .select("userid username")
      .exec();
    const othersMap = new Map(others.map((o) => [o.userid, o.username]));
    const out = requests.map((r) => {
      const otherId = r.from === useridNum ? r.to : r.from;
      const username = othersMap.get(otherId) ?? String(otherId);
      const status = r.from === useridNum ? "sent" : "received";
      return { rid: r.rid, username, status };
    });

    return new Response(JSON.stringify({ requests: out }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
