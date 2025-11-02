import express from "express";
import { getAdminSummary } from "../controllers/adminSummaryController.js";

const router = express.Router();

/** GET /api/admin/summary
 * Return summary dashboard
 */
router.get("/summary", getAdminSummary);

export default router;
