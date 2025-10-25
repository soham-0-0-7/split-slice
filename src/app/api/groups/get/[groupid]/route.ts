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

    // users who are not members (candidates to add)
    const candidates = await User.find({ userid: { $nin: group.members } })
      .select("userid username")
      .exec();

    return new Response(
      JSON.stringify({
        group: {
          groupid: group.groupid,
          groupname: group.groupname,
          owner: group.owner,
          ownersAddOnly: group.ownersAddOnly,
        },
        membersList: candidates.map((u) => ({
          userid: u.userid,
          username: u.username,
        })),
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
