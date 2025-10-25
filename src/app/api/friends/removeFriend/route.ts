import { connectDB } from "@/server/db";
import { User } from "@/server/models/user";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { fromUsername, toDelete } = body as {
      fromUsername?: string;
      toDelete?: string;
    };
    if (!fromUsername || !toDelete)
      return new Response(
        JSON.stringify({ error: "fromUsername and toDelete required" }),
        { status: 400 }
      );

    await connectDB();
    const fromUser = await User.findOne({ username: fromUsername }).exec();
    const toUser = await User.findOne({ username: toDelete }).exec();
    if (!fromUser || !toUser)
      return new Response(JSON.stringify({ error: "usernames do not exist" }), {
        status: 400,
      });

    // remove each other from friendlists
    await User.updateOne(
      { userid: fromUser.userid },
      { $pull: { friendlist: toUser.userid } }
    ).exec();
    await User.updateOne(
      { userid: toUser.userid },
      { $pull: { friendlist: fromUser.userid } }
    ).exec();

    return new Response(JSON.stringify({ message: "friend removed" }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
