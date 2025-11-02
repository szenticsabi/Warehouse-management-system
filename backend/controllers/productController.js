import Product from "../models/Product.js";

/**
 * GET /api/product/list
 * Return all products with populated category and warehouse, sorted by creation time
 */
const listProducts = async (_req, res) => {
  try {
    const items = await Product.find()
      .populate({ path: "category", select: "id name" })
      .populate({ path: "warehouse", select: "id name" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    console.error("listProducts error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export { listProducts };
