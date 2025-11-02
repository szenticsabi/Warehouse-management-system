import express from "express";
import { listWarehouses, addWarehouses, updateWarehouses, deleteWarehouses, getWarehouseProducts, } from "../controllers/warehouseController.js";

const router = express.Router();

/** GET /api/warehouse/list
 * List warehouses sorted by id
 */
router.get("/list", listWarehouses);

/** POST /api/warehouse/add
 * Create warehouse, server gives id
 */
router.post("/add", addWarehouses);

/** PUT /api/warehouse/update/:id
 * Update warehouse by MongoDB _id
 */
router.put("/update/:id", updateWarehouses);

/** DELETE /api/warehouse/delete/:id
 * Delete warehouse by MongoDB _id
 */
router.delete("/delete/:id", deleteWarehouses);

/** GET /api/warehouse/:id/products
 * List products stored in the warehouse with category names by warehouse MongoDB _id
 */
router.get("/:id/products", getWarehouseProducts);

export default router;