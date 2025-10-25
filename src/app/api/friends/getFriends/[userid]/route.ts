import { connectDB } from "@/server/db";
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

    const friends = await User.find({ userid: { $in: user.friendlist } })
      .select("username userid")
      .exec();
    const usernames = friends.map((f) => f.username);
    return new Response(JSON.stringify({ usernames }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
