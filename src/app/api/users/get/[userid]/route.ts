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
    const user = await User.findOne({ userid: useridNum })
      .select("userid username")
      .exec();
    if (!user)
      return new Response(JSON.stringify({ error: "user not found" }), {
        status: 404,
      });
    return new Response(
      JSON.stringify({
        user: { userid: user.userid, username: user.username },
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
