import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";
import ToOrder from "../models/toOrder.js";

const getAdminSummary = async (_req, res) => {
  try {
    // Default numbers (totals, low stock, toOrder by status)
    const [
      productsCount, categoriesCount, warehousesCount, usersCount, lowStockCount, toOrderPending, toOrderOrdered, toOrderReceived] = await Promise.all([
        Product.countDocuments({}),
        Category.countDocuments({}),
        Warehouse.countDocuments({}),
        User.countDocuments({}),
        Product.countDocuments({ stock: { $lte: 5 } }),
        ToOrder.countDocuments({ status: "pending" }),
        ToOrder.countDocuments({ status: "ordered" }),
        ToOrder.countDocuments({ status: "received" }),
      ]);

    // Inventory value, sum (price * stock)
    const invAgg = await Product.aggregate([
      { $project: { value: { $multiply: ["$price", "$stock"] } } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);
    const inventoryValue =
      (invAgg && invAgg[0] && typeof invAgg[0].total === "number" ? invAgg[0].total : 0);

    // Users grouped by roles
    const usersByRoleAgg = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const usersByRole = usersByRoleAgg.reduce(function (acc, r) {
      acc[r._id] = r.count;
      return acc;
    }, {});

    // Orders with necessary fields, ordered by status (fulfilled bottom of the page), collect last 10 on the dashboard
    const orders = await Order.find({})
      .select("id items createdAt")
      .sort({ createdAt: -1 })
      .lean();

    let ordersPending = 0;
    let ordersFulfilled = 0;
    const latestOrders = [];

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const itemsArr = (o && o.items) || [];
      // Fulfilled if every item is fulfilled
      const allFulfilled = itemsArr.every(function (it) { return it.status === "fulfilled"; });

      if (allFulfilled) ordersFulfilled++;
      else ordersPending++;

      if (latestOrders.length < 10) {
        latestOrders.push({
          _id: o._id,
          id: o.id,
          itemsCount: itemsArr.length || 0,
          status: allFulfilled ? "fulfilled" : "pending",
          createdAt: o.createdAt,
        });
      }
    }

    // Final dashboard payload
    return res.status(200).json({
      success: true,
      data: {
        cards: {
          productsCount: productsCount,
          lowStockCount: lowStockCount,
          categoriesCount: categoriesCount,
          warehousesCount: warehousesCount,
          usersCount: usersCount,
          inventoryValue: inventoryValue,
          ordersPending: ordersPending,
          ordersFulfilled: ordersFulfilled,
          toOrder: {
            pending: toOrderPending,
            ordered: toOrderOrdered,
            received: toOrderReceived,
          },
          usersByRole: usersByRole,
        },
        latestOrders: latestOrders,
      },
    });
  } catch (e) {
    // Path error
    console.error("getAdminSummary error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { getAdminSummary };
