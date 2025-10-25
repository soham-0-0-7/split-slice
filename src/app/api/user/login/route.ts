import { connectDB } from "@/server/db";
import { User } from "@/server/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "please-set-a-secret";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "username and password required" }),
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username }).exec();
    if (!user)
      return new Response(JSON.stringify({ error: "invalid credentials" }), {
        status: 401,
      });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return new Response(JSON.stringify({ error: "invalid credentials" }), {
        status: 401,
      });

    const token = jwt.sign(
      { username: user.username, userid: user.userid },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // include the friendlist (array of userids) so client can store it
    return new Response(
      JSON.stringify({ token, friendlist: user.friendlist ?? [] }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
