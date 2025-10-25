import { connectDB } from "@/server/db";
import { Group } from "@/server/models/group";
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

    const groups = await Group.find({ members: useridNum }).exec();
    // For each group, add isOwner: true/false
    const groupsWithRole = groups.map((g) => ({
      groupid: g.groupid,
      groupname: g.groupname,
      owner: g.owner,
      members: g.members,
      createdOn: g.createdOn,
      ownersAddOnly: g.ownersAddOnly,
      isOwner: g.owner === useridNum,
      isMember: g.members.includes(useridNum),
    }));
    return new Response(JSON.stringify({ groups: groupsWithRole }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
