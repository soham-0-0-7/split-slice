import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "./counter";

export interface IUser extends Document {
  userid: number;
  username: string;
  password: string;
  friendlist: number[]; // store userids
}

const UserSchema = new Schema<IUser>(
  {
    userid: { type: Number, unique: true, index: true },
    username: { type: String, unique: true, required: true, index: true },
    password: { type: String, required: true },
    friendlist: { type: [Number], default: [] },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function (next) {
  if (this.isNew && (this.userid === undefined || this.userid === null)) {
    this.userid = await getNextSequence("users");
  }
  next();
});

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
