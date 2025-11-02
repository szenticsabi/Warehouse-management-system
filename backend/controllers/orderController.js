import Order from "../models/Order.js";
import "../models/Product.js";  // Registered for population
import "../models/Category.js";  // Registered for population


// Helper, compute overall order status from its items
function calcOrderStatusFromItems(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return "pending";
  return arr.every(function (it) { return it.status === "fulfilled"; }) ? "fulfilled" : "pending";
}

/** GET /api/order/list
 * List orders oldest to earliest, populate product fields, add derivedStatus
*/
const listOrders = async (_req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: 1 })
      .populate({ path: "items.product", select: "name sku price stock" })
      .lean();

    // derivedStatus field for client
    const data = orders.map(function (o) {
      return Object.assign({}, o, { derivedStatus: calcOrderStatusFromItems(o.items) });
    });

    return res.status(200).json({ success: true, data: data });
  } catch (e) {
    console.error("listOrders error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PUT /api/order/update/:id  (:id = Mongo _id)
 * body: { items: [{ product, qty, status }] }
 * Overwrites the items array if provided, return doc + derivedStatus
*/
const updateOrder = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (Array.isArray(req.body.items)) {

      // Replace items array
      order.items = req.body.items.map(function (it) {
        return {
          product: it.product,
          qty: Number(it.qty || 1),
          status: it.status === "fulfilled" ? "fulfilled" : "pending",
        };
      });
    }

    await order.save();

    const saved = await Order.findById(order._id)
      .populate({ path: "items.product", select: "name sku price stock" })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Order updated",
      data: Object.assign({}, saved, { derivedStatus: calcOrderStatusFromItems(saved && saved.items) }),
    });
  } catch (e) {
    console.error("updateOrder error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** DELETE /api/order/delete/:id
 * Delete order by MongoDB _id
*/
const deleteOrder = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, message: "Order deleted" });
  } catch (e) {
    console.error("deleteOrder error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { listOrders, updateOrder, deleteOrder };
