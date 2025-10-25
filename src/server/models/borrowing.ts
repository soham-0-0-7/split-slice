import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "./counter";

export interface IBorrowing extends Document {
  bid: number;
  lender: number; // userid
  borrower: number; // userid
  amount: number;
  borrowedOn: Date;
  expenseid?: number; // link back to Expense.eid
  groupId: number;
}

const BorrowingSchema = new Schema<IBorrowing>({
  bid: { type: Number, unique: true, index: true },
  lender: { type: Number, required: true, index: true },
  borrower: { type: Number, required: true, index: true },
  amount: { type: Number, required: true },
  borrowedOn: { type: Date, default: () => new Date() },
  expenseid: { type: Number, index: true },
  groupId: { type: Number, required: true ,index: true },
});

BorrowingSchema.pre<IBorrowing>("save", async function (next) {
  if (this.isNew && (this.bid === undefined || this.bid === null)) {
    this.bid = await getNextSequence("borrowings");
  }
  next();
});

export const Borrowing: Model<IBorrowing> =
  (mongoose.models.Borrowing as Model<IBorrowing>) ||
  mongoose.model<IBorrowing>("Borrowing", BorrowingSchema);
