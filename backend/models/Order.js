import mongoose from "mongoose";

/** Order schema
 * id: unique id, not equal to MongoDB _id
 * items: product ref, qty number default 1, status enum ("pending" or "fulfilled")
 * timestamps: adds createdAd and updatedAt fields
 */
const orderSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        qty: { type: Number, default: 1 },
        status: { type: String, enum: ["pending", "fulfilled"], default: "pending" }
    }]
},
    {
        timestamps: true
    })

const Order = mongoose.model("Order", orderSchema);
export default Order;