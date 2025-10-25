import { connectDB } from "@/server/db";
import { Settlement } from "@/server/models/settlement";

export async function GET(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const groupIdStr = resolvedParams?.groupid;
    const groupId = Number(groupIdStr);
    if (Number.isNaN(groupId))
      return new Response(JSON.stringify({ error: "invalid groupid" }), {
        status: 400,
      });

    await connectDB();
    const settles = await Settlement.find({ groupId }).sort({ sid: 1 }).exec();
    return new Response(JSON.stringify({ settlements: settles }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
