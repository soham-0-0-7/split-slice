import { connectDB } from "@/server/db";
import { User } from "@/server/models/user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body as { ids?: number[] };
    if (!Array.isArray(ids))
      return new Response(JSON.stringify({ error: "ids must be array" }), {
        status: 400,
      });
    await connectDB();
    const users = await User.find({ userid: { $in: ids } })
      .select("userid username")
      .exec();
    const out = users.map((u) => ({ userid: u.userid, username: u.username }));
    return new Response(JSON.stringify({ users: out }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      {
        status: 500,
      }
    );
  }
}
