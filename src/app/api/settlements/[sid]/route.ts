import { connectDB } from "@/server/db";
import { Settlement } from "@/server/models/settlement";

export async function DELETE(req: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams =
      params && typeof params.then === "function" ? await params : params;
    const sidStr = resolvedParams?.sid;
    const sid = Number(sidStr);
    if (Number.isNaN(sid))
      return new Response(JSON.stringify({ error: "invalid sid" }), {
        status: 400,
      });

    await connectDB();
    const res = await Settlement.findOneAndDelete({ sid }).exec();
    if (!res)
      return new Response(JSON.stringify({ error: "settlement not found" }), {
        status: 404,
      });
    return new Response(JSON.stringify({ message: "settlement deleted" }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500 }
    );
  }
}
