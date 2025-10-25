import { connectDB } from "@/server/db";
import { FriendRequest } from "@/server/models/friendRequest";
import { User } from "@/server/models/user";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { rid, action } = body as { rid?: number; action?: string };
    if (rid === undefined || !action)
      return new Response(
        JSON.stringify({ error: "rid and action required" }),
        { status: 400 }
      );
    if (!["accept", "reject"].includes(action))
      return new Response(JSON.stringify({ error: "invalid action" }), {
        status: 400,
      });

    await connectDB();
    const fr = await FriendRequest.findOne({ rid }).exec();
    if (!fr)
      return new Response(
        JSON.stringify({ error: "friend request not found" }),
        { status: 404 }
      );

    if (action === "accept") {
      // update both users' friendlists
      await User.updateOne(
        { userid: fr.from },
        { $addToSet: { friendlist: fr.to } }
      ).exec();
      await User.updateOne(
        { userid: fr.to },
        { $addToSet: { friendlist: fr.from } }
      ).exec();
      // delete friend request
      await FriendRequest.deleteOne({ rid }).exec();
      return new Response(JSON.stringify({ message: "accepted" }), {
        status: 200,
      });
    } else {
      // reject -> just delete
      await FriendRequest.deleteOne({ rid }).exec();
      return new Response(JSON.stringify({ message: "rejected" }), {
        status: 200,
      });
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
