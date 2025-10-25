import { NextResponse } from "next/server";
import dbConnect from "@/server/db";
import { Settlement } from "@/server/models/settlement";
import { User } from "@/server/models/user";
import verifyTokenFromHeader from "@/server/middleware/verifyToken";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const viewer = verifyTokenFromHeader(auth ?? undefined);

    const body = await req.json();
    const { username1, username2 } = body || {};
    if (!username1 || !username2)
      return NextResponse.json({ error: "missing usernames" }, { status: 400 });

    // viewer must be one of the two users
    if (viewer.username !== username1 && viewer.username !== username2)
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });

    await dbConnect();

    // find user ids
    const u1 = await User.findOne({ username: username1 });
    const u2 = await User.findOne({ username: username2 });
    if (!u1 || !u2)
      return NextResponse.json({ error: "user(s) not found" }, { status: 404 });

    // delete any settlements where payee/receiver match either direction AND both usernames match
    const res = await Settlement.deleteMany({
      $or: [
        { payee: u1.userid, receiver: u2.userid },
        { payee: u2.userid, receiver: u1.userid },
      ],
    });

    return NextResponse.json({ deleted: res.deletedCount || 0 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
