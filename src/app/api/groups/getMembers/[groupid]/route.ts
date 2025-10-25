import { connectDB } from "@/server/db";
import { Group } from "@/server/models/group";
import { User } from "@/server/models/user";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const groupidStr = resolvedParams?.groupid;
    const groupid = Number(groupidStr);
    if (Number.isNaN(groupid))
      return new Response(JSON.stringify({ error: "invalid groupid" }), {
        status: 400,
      });

    await connectDB();
    const group = await Group.findOne({ groupid }).exec();
    if (!group)
      return new Response(JSON.stringify({ error: "group not found" }), {
        status: 404,
      });

    const members = await User.find({ userid: { $in: group.members } })
      .select("userid username")
      .exec();

    return new Response(
      JSON.stringify({
        groupname: group.groupname,
        members: members.map((m) => ({
          userid: m.userid,
          username: m.username,
        })),
        total: members.length,
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
