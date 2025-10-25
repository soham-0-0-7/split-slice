import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "./counter";

export interface IFriendRequest extends Document {
  rid: number;
  from: number; // userid
  to: number; // userid
  createdOn: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>({
  rid: { type: Number, unique: true, index: true },
  from: { type: Number, required: true, index: true },
  to: { type: Number, required: true, index: true },
  createdOn: { type: Date, default: () => new Date() },
});

FriendRequestSchema.pre<IFriendRequest>("save", async function (next) {
  if (this.isNew && (this.rid === undefined || this.rid === null)) {
    this.rid = await getNextSequence("friendrequests");
  }
  next();
});

export const FriendRequest: Model<IFriendRequest> =
  (mongoose.models.FriendRequest as Model<IFriendRequest>) ||
  mongoose.model<IFriendRequest>("FriendRequest", FriendRequestSchema);
