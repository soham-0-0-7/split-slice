import { connectDB } from "@/server/db";
import { FriendRequest } from "@/server/models/friendRequest";
import { User } from "@/server/models/user";

export async function DELETE(req: Request) {
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

    await connectDB();
    const fromUser = await User.findOne({ username: fromUsername }).exec();
    const toUser = await User.findOne({ username: toUsername }).exec();
    if (!fromUser || !toUser)
      return new Response(JSON.stringify({ error: "usernames do not exist" }), {
        status: 400,
      });

    const fr = await FriendRequest.findOne({
      from: fromUser.userid,
      to: toUser.userid,
    }).exec();
    if (!fr)
      return new Response(
        JSON.stringify({
          error: "friend request not found or not sent by this user",
        }),
        { status: 404 }
      );

    await FriendRequest.deleteOne({ rid: fr.rid }).exec();
    return new Response(JSON.stringify({ message: "request revoked" }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
