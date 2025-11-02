import mongoose from "mongoose";

/** ToOrder schema
 * product: ref to Product
 * stock: optional value, default 0
 * status: enum ("peding", "ordered" or "received")
 * timestamps: adds createdAt and updatedAt fields
 */
const toOrderSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    stock: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "ordered", "received"], default: "pending" },
  },
  { timestamps: true }
);

const ToOrder = mongoose.model("ToOrder", toOrderSchema);
export default ToOrder;