import mongoose from "mongoose";

/** Category schema
 * id: unique id, not equal to MongoDB _id
 * name: display name
 * description: text
 */
const categorySchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String }
})

const Category = mongoose.model("Category", categorySchema);
export default Category;