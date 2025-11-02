import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import "../models/Warehouse.js";

// Next id for category
async function getNextCategoryId() {
  const last = await Category.findOne().sort({ id: -1 }).select("id").lean();
  return ((last && last.id) || 0) + 1;
}

/** GET /api/category/list
 * List all categories ordered by id
 */
const listCategories = async (_req, res) => {
  try {
    const items = await Category.find()
      .sort({ id: 1 })
      .select("_id id name description")
      .lean();
    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** POST /api/category/add
 *  Server assigns the next id, not the client
 */
const addCategory = async (req, res) => {
  try {
    const name = (req.body.categoryName || "").trim();
    const description = (req.body.categoryDescription || "").trim();

    // Validate name
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Find next id and create
    const nextId = await getNextCategoryId();
    const doc = await Category.create({ id: nextId, name: name, description: description });

    return res.status(201).json({
      success: true,
      message: "Category created",
      data: { _id: doc._id, id: doc.id, name: doc.name, description: doc.description },
    });
  } catch (e) {

    // Duplicate id
    if (e && e.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate category id" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PUT /api/category/update/:id  (:id = Mongo _id)
 * Update mutable fields, return the updated doc
 */
const updateCategory = async (req, res) => {
  try {
    const id = req.params.id; // Mongo _id
    const categoryName = req.body.categoryName;
    const categoryDescription = req.body.categoryDescription;

    // Create partial update for the provided fields
    const update = {};
    if (categoryName !== undefined) update.name = String(categoryName).trim();
    if (categoryDescription !== undefined) update.description = String(categoryDescription).trim();

    const doc = await Category.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({
      success: true,
      message: "Category updated",
      data: { _id: doc._id, id: doc.id, name: doc.name, description: doc.description },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** DELETE /api/category/delete/:id  (:id = Mongo _id)
 *  Remove category by MongoDB _id
 */
const deleteCategory = async (req, res) => {
  try {
    const id = req.params.id; // Mongo _id
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({
      success: true,
      message: "Category deleted",
      data: { _id: deleted._id, id: deleted.id, name: deleted.name },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**GET /api/category/:id/products   (:id = Category Mongo _id)
 *  List products with the given category, populates category and warehouse
 */
const getCategoryProducts = async (req, res) => {
  try {
    const id = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const items = await Product.find({ category: id })
      .select("name sku price stock category warehouse")
      .populate("category", "id name")
      .populate("warehouse", "name address")
      .lean();

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getCategoryProducts error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { addCategory, listCategories, updateCategory, deleteCategory, getCategoryProducts };
