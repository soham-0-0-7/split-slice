import { connectDB } from "@/server/db";
import { FriendRequest } from "@/server/models/friendRequest";
import { User } from "@/server/models/user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromUsername, toUsername } = body as {
      fromUsername?: string;
      toUsername?: string;
    };
    if (!fromUsername || !toUsername)
      return new Response(
        JSON.stringify({ error: "fromUsername and toUsername required" }),
        { status: 400 }
      );

    if (fromUsername === toUsername)
      return new Response(
        JSON.stringify({ error: "cannot send request to yourself" }),
        { status: 400 }
      );

    await connectDB();
    const fromUser = await User.findOne({ username: fromUsername }).exec();
    const toUser = await User.findOne({ username: toUsername }).exec();
    const missing: string[] = [];
    if (!fromUser) missing.push(fromUsername);
    if (!toUser) missing.push(toUsername);
    if (missing.length)
      return new Response(
        JSON.stringify({ error: "usernames do not exist", missing }),
        { status: 400 }
      );

    // check if they are already friends
    const alreadyFriends = (fromUser!.friendlist || []).includes(
      toUser!.userid
    );
    if (alreadyFriends)
      return new Response(
        JSON.stringify({ error: "users are already friends" }),
        { status: 400 }
      );

    // check for existing pending requests between the two (either direction)
    const existingReq = await FriendRequest.findOne({
      $or: [
        { from: fromUser!.userid, to: toUser!.userid },
        { from: toUser!.userid, to: fromUser!.userid },
      ],
    }).exec();
    if (existingReq)
      return new Response(
        JSON.stringify({ error: "friend request already exists" }),
        { status: 400 }
      );

    // create friend request
    const fr = new FriendRequest({
      from: fromUser!.userid,
      to: toUser!.userid,
    });
    await fr.save();
    return new Response(
      JSON.stringify({ message: "request created", rid: fr.rid }),
      { status: 201 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
