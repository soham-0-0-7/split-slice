import mongoose from "mongoose";

const MONGO_URI = process.env.DATABASE_URI;
if (!MONGO_URI) {
  throw new Error("Missing DATABASE_URI environment variable");
}

declare global {
  // keep global to avoid creating multiple connections in dev/hot reload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __mongoose__:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const globalAny: any = global;
if (!globalAny.__mongoose__)
  globalAny.__mongoose__ = { conn: null, promise: null };

export async function connectDB(): Promise<typeof mongoose> {
  if (globalAny.__mongoose__.conn) {
    return globalAny.__mongoose__.conn;
  }

  if (!globalAny.__mongoose__.promise) {
    mongoose.set("strictQuery", false);
    // MONGO_URI is validated above; assert non-null for TS
    globalAny.__mongoose__.promise = mongoose
      .connect(MONGO_URI!)
      .then((m) => m);
  }

  globalAny.__mongoose__.conn = await globalAny.__mongoose__.promise;
  return globalAny.__mongoose__.conn;
}

export default connectDB;
