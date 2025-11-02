import express from "express";
import { listProducts } from "../controllers/productController.js";

const router = express.Router();

/** GET /api/product/list
 * List products with populated category and warehouse
 */
router.get("/list", listProducts);


export default router;
