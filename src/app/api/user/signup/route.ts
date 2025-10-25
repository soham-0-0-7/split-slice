import type { NextRequest } from "next/server";
import { connectDB } from "@/server/db";
import { User } from "@/server/models/user";
import bcrypt from "bcryptjs";

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

    const existing = await User.findOne({ username }).lean().exec();
    if (existing) {
      return new Response(
        JSON.stringify({ error: "username already exists" }),
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();

    return new Response(
      JSON.stringify({ message: "Account creation successful, now login" }),
      { status: 201 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
