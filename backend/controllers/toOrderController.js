import ToOrder from "../models/toOrder.js";

/**
 * GET /api/toorder/list
 * Fetch all to-order rows
 * Populate product with category and warehouse, sorted by newest to oldest
 */
const listToOrder = async (_req, res) => {
  try {
    const items = await ToOrder.find()
      .populate({
        path: "product",
        select: "name sku price stock category warehouse",
        populate: [
          { path: "category", select: "id name" },
          { path: "warehouse", select: "id name" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    console.error("listToOrder error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/toorder/add-selection
 * body: { ids: ["productId1", "productId2", ...] }
 * Simple upsert per product, keep single pending entry per product
 */
const addSelectionToOrder = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "No ids provided." });
    }

    // Upsert each id, if a pending row exists for the product, don't duplicate
    await Promise.all(
      ids.map((id) =>
        ToOrder.updateOne(
          { product: id, status: "pending" },
          { $setOnInsert: { product: id, status: "pending" } },
          { upsert: true }
        )
      )
    );

    return res.status(201).json({ success: true, message: "Added to To-Order." });
  } catch (e) {
    console.error("addSelectionToOrder error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/toorder/update/:id
 * body: { status?, stock? }
 * Partial update, change status and stock if provided
 */
const updateToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = {};
    if (req.body.status !== undefined) fields.status = req.body.status;
    if (req.body.stock !== undefined) fields.stock = Number(req.body.stock) || 0;

    const updated = await ToOrder.findByIdAndUpdate(id, fields, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, data: updated });
  } catch (e) {
    console.error("updateToOrder error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/toorder/delete/:id
 * Delete to-order row by MongoDB _id
 */
const deleteToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const del = await ToOrder.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, data: { _id: del._id } });
  } catch (e) {
    console.error("deleteToOrder error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { listToOrder, addSelectionToOrder, updateToOrder, deleteToOrder };
