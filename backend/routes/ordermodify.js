import express from "express";
import { listOrders, updateOrder, deleteOrder } from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../controllers/authController.js";

const router = express.Router();

/** GET /api/order/list
 * List all orders
 */
router.get("/list", listOrders);

/** PUT /api/order/update/:id
 * Update items of an order by MongoDB _id
 */
router.put("/update/:id", updateOrder);

/** DELETE /api/order/delete/:id
 * Delete order by MongoDB _id, only with admin role
 */
router.delete("/delete/:id", requireAuth, requireRole("admin"), deleteOrder);

export default router;