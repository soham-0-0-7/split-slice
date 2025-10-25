import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "./counter";

export interface IExpense extends Document {
  eid: number;
  paidBy: number; // userid
  // borrowers and borrowings moved to separate Borrowing model for scalability
  amount: number;
  createdOn: Date;
  description?: string;
  groupId: number;
  category?: "food" | "travel" | "gifts";
}

const ExpenseSchema = new Schema<IExpense>({
  eid: { type: Number, unique: true, index: true },
  paidBy: { type: Number, required: true, index: true },
  amount: { type: Number, required: true },
  createdOn: { type: Date, default: () => new Date() },
  description: { type: String },
  groupId: { type: Number, required: true, index: true },
  category: {
    type: String,
    enum: ["food", "travel", "gifts"],
    required: false,
  },
});

ExpenseSchema.pre<IExpense>("save", async function (next) {
  if (this.isNew && (this.eid === undefined || this.eid === null)) {
    this.eid = await getNextSequence("expenses");
  }
  next();
});

export const Expense: Model<IExpense> =
  (mongoose.models.Expense as Model<IExpense>) ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
