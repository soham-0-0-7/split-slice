import { connectDB } from "@/server/db";
import { Group } from "@/server/models/group";
import { User } from "@/server/models/user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupname, ownerUserid, members, ownersAddOnly } = body as {
      groupname?: string;
      ownerUserid?: number;
      members?: string[]; // array of usernames
      ownersAddOnly?: boolean;
    };

    if (!groupname || ownerUserid === undefined) {
      return new Response(
        JSON.stringify({ error: "groupname and ownerUserid required" }),
        { status: 400 }
      );
    }

    await connectDB();

    // validate owner exists
    const owner = await User.findOne({ userid: ownerUserid }).exec();
    if (!owner) {
      return new Response(
        JSON.stringify({ error: "owner userid does not exist" }),
        { status: 400 }
      );
    }

    // resolve usernames to userids
    let memberIds: number[] = [];
    if (Array.isArray(members) && members.length > 0) {
      const users = await User.find({ username: { $in: members } })
        .select("userid")
        .exec();
      memberIds = users.map((u) => u.userid);
    }

    // ensure owner is included
    if (!memberIds.includes(ownerUserid)) memberIds.push(ownerUserid);

    // check which users exist (now including owner)
    const existingUsers = await User.find({
      userid: { $in: memberIds },
    }).exec();
    const existingIds = new Set(existingUsers.map((u) => u.userid));
    const nonExistent = memberIds.filter((id) => !existingIds.has(id));

    // if none of the provided members exist (including owner) then fatal
    if (memberIds.length > 0 && existingUsers.length === 0) {
      return new Response(
        JSON.stringify({
          error: "no provided member users exist",
          nonExistent,
        }),
        { status: 400 }
      );
    }

    // create group. members are the existingIds (owner guaranteed present)
    const membersArr = Array.from(existingIds);

    // Validate: there must be at least one member besides the owner
    const nonOwnerMembers = membersArr.filter((id) => id !== ownerUserid);
    if (nonOwnerMembers.length === 0) {
      return new Response(
        JSON.stringify({ error: "no members provided besides owner" }),
        { status: 400 }
      );
    }

    const g = new Group({
      groupname,
      owner: ownerUserid,
      members: membersArr,
      ownersAddOnly: !!ownersAddOnly,
    });
    await g.save();

    await User.updateMany(
      { userid: { $in: membersArr } },
      { $addToSet: { groups: g.groupid } }
    ).exec();

    const msg = {
      message: "group created",
      groupid: g.groupid,
      nonExistent,
    };
    const status =
      nonExistent.length === 0 ? 200 : existingUsers.length > 0 ? 207 : 400;
    return new Response(JSON.stringify(msg), { status });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
