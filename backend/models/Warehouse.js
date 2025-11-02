import mongoose from "mongoose";

/** Warehouse schema
 * id: unique id, not equal to MongoDB _id
 * name: unique display name
 * address: optional text
 */
const warehouseSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    address: { type: String, default: "" }
},
)

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
export default Warehouse;