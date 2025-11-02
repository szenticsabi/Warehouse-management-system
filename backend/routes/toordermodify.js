import express from "express";
import { listToOrder, addSelectionToOrder, updateToOrder, deleteToOrder, } from "../controllers/toOrderController.js";

const router = express.Router();

/** GET /api/toorder/list
 * List all to-order items with populated product info
 */
router.get("/list", listToOrder);

/** PUT /api/toorder/update/:id
 * Update to-order status and stock by MongoDB _id
 */
router.put("/update/:id", updateToOrder);

/** DELETE /api/toorder/delete/:id
 * Delete to-order doc by MongoDB _id
 */
router.delete("/delete/:id", deleteToOrder);

/** POST /api/toorder/
 * Upsert(update+insert) products into To-Order
 */
router.post("/add-selection", addSelectionToOrder);

export default router;
