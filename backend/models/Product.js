import mongoose from "mongoose";

/** Product schema
 * name: display name
 * sku: unique identifier
 * price and stock: numbers, default 0
 * category and warehouse: refs to related docs 
 * timestamps: adds createdAt an updatedAt fields
 */
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true }
},
    {
        timestamps: true
    })

const Product = mongoose.model("Product", productSchema);
export default Product;