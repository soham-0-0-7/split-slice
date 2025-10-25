import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "./counter";

export interface IGroup extends Document {
  groupid: number;
  groupname: string;
  owner: number; // userid
  members: number[]; // userids
  createdOn: Date;
  ownersAddOnly: boolean;
}

const GroupSchema = new Schema<IGroup>({
  groupid: { type: Number, unique: true, index: true },
  groupname: { type: String, required: true },
  owner: { type: Number, required: true, index: true },
  members: { type: [Number], default: [] },
  createdOn: { type: Date, default: () => new Date() },
  ownersAddOnly: { type: Boolean, default: false },
});

GroupSchema.pre<IGroup>("save", async function (next) {
  if (this.isNew && (this.groupid === undefined || this.groupid === null)) {
    this.groupid = await getNextSequence("groups");
  }
  next();
});

export const Group: Model<IGroup> =
  (mongoose.models.Group as Model<IGroup>) ||
  mongoose.model<IGroup>("Group", GroupSchema);
