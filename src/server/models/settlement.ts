import mongoose from "mongoose";
import type { Document, Model } from "mongoose";
import { getNextSequence } from "./counter";

const { Schema } = mongoose;

export interface ISettlement extends Document {
  sid: number;
  payee: number; // userid
  receiver: number; // userid
  amount: number;
  createdOn: Date;
  groupId?: number;
}

const SettlementSchema = new Schema<ISettlement>({
  sid: { type: Number, unique: true, index: true },
  payee: { type: Number, required: true, index: true },
  receiver: { type: Number, required: true, index: true },
  amount: { type: Number, required: true },
  groupId: { type: Number, index: true },
  createdOn: { type: Date, default: () => new Date() },
});

SettlementSchema.pre<ISettlement>("save", async function (next) {
  if (this.isNew && (this.sid === undefined || this.sid === null)) {
    this.sid = await getNextSequence("settlements");
  }
  next();
});

export const Settlement: Model<ISettlement> =
  (mongoose.models.Settlement as Model<ISettlement>) ||
  mongoose.model<ISettlement>("Settlement", SettlementSchema);
