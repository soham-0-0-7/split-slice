import { connectDB } from "@/server/db";
import { User } from "@/server/models/user";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const username = resolvedParams?.username;
    if (!username)
      return new Response(JSON.stringify({ error: "missing username" }), {
        status: 400,
      });

    await connectDB();
    const user = await User.findOne({ username: String(username) })
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
