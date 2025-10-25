import { connectDB } from "@/server/db";
import { Group } from "@/server/models/group";
import { User } from "@/server/models/user";
import verifyTokenFromHeader from "@/server/middleware/verifyToken";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") ?? undefined;
    const payload = verifyTokenFromHeader(auth as string | undefined);
    const actorUserid = (payload as any).userid;

    const body = await req.json();
    const { groupId, usernames } = body as {
      groupId?: number;
      usernames?: string[];
    };
    if (groupId === undefined || !Array.isArray(usernames)) {
      return new Response(
        JSON.stringify({ error: "groupId and usernames required" }),
        { status: 400 }
      );
    }

    await connectDB();
    const group = await Group.findOne({ groupid: groupId }).exec();
    if (!group)
      return new Response(JSON.stringify({ error: "group not found" }), {
        status: 404,
      });

    // ownersAddOnly check
    if (group.ownersAddOnly === true && group.owner !== actorUserid) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      });
    }

    // resolve usernames -> userids
    const users = await User.find({ username: { $in: usernames } })
      .select("userid username")
      .exec();
    const foundMap = new Map(users.map((u) => [u.username, u.userid]));

    const toAdd: number[] = [];
    const addedUsernames: string[] = [];
    const alreadyMembers: string[] = [];
    const notFound: string[] = [];

    for (const uname of usernames) {
      const uid = foundMap.get(uname);
      if (!uid) {
        notFound.push(uname);
        continue;
      }
      if (group.members.includes(uid)) {
        alreadyMembers.push(uname);
        continue;
      }
      toAdd.push(uid);
      addedUsernames.push(uname);
    }

    if (toAdd.length === 0) {
      return new Response(
        JSON.stringify({
          error: "no valid members to add",
          added: addedUsernames,
          alreadyMembers,
          notFound,
        }),
        { status: 400 }
      );
    }

    // append and save
    group.members = [...group.members, ...toAdd];
    await group.save();

    return new Response(
      JSON.stringify({
        message: "members added",
        added: addedUsernames,
        alreadyMembers,
        notFound,
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
