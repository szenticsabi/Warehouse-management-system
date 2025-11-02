import mongoose from "mongoose";
import Warehouse from "../models/Warehouse.js";
import Product from "../models/Product.js";     // used by view products endpoint
import "../models/Category.js";                 // Register for populate

// Next warehouse id
async function getNextWarehouseId() {
  const last = await Warehouse.findOne().sort({ id: -1 }).select("id").lean();
  return ((last && last.id) || 0) + 1;
}

/** GET /api/warehouse/list
 * Return all warehouses sorted by id
*/
const listWarehouses = async (_req, res) => {
  try {
    const items = await Warehouse.find()
      .sort({ id: 1 })
      .select("_id id name address")
      .lean();

    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** POST /api/warehouse/add
 * Validate name, enforce unique name, assign next id, create
*/
const addWarehouses = async (req, res) => {
  try {
    const name = String((req.body && req.body.name) || "").trim();
    const address = String((req.body && req.body.address) || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Warehouse name is required" });
    }

    // Enforce unique name
    const exists = await Warehouse.findOne({ name: name }).lean();
    if (exists) {
      return res.status(409).json({ success: false, message: "Warehouse name already exists" });
    }

    const nextId = await getNextWarehouseId();
    const doc = await Warehouse.create({ id: nextId, name: name, address: address });

    return res.status(201).json({
      success: true,
      message: "Warehouse created",
      data: { _id: doc._id, id: doc.id, name: doc.name, address: doc.address },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PUT /api/warehouse/update/:id   (:id = Mongo _id)
 * Partial update, validates unique name when changed
*/
const updateWarehouses = async (req, res) => {
  try {
    const id = req.params.id;
    const update = {};
    if ((req.body && req.body.name) !== undefined) update.name = String(req.body.name).trim();
    if ((req.body && req.body.address) !== undefined) update.address = String(req.body.address).trim();

    // Check uniqueness when being changed
    if (update.name) {
      const exists = await Warehouse.findOne({ name: update.name, _id: { $ne: id } }).lean();
      if (exists) {
        return res.status(409).json({ success: false, message: "Warehouse name already exists" });
      }
    }

    const doc = await Warehouse.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Warehouse updated",
      data: { _id: doc._id, id: doc.id, name: doc.name, address: doc.address },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** DELETE /api/warehouse/delete/:id   (:id = Mongo _id)
 * Delete warehouse by MongoDB _id
*/
const deleteWarehouses = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Warehouse.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Warehouse deleted",
      data: { _id: deleted._id, id: deleted.id, name: deleted.name },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** GET /api/warehouse/:id/products   (:id = Warehouse Mongo _id)
 * Return stored products in this warehouse, populate category for display
*/
const getWarehouseProducts = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse id" });
    }

    const items = await Product.find({ warehouse: id })
      .select("name sku price stock category warehouse")
      .populate("category", "id name")
      .lean();

    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    console.error("getWarehouseProducts error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { listWarehouses, addWarehouses, updateWarehouses, deleteWarehouses, getWarehouseProducts };
