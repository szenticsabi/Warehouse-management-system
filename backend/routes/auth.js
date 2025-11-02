import express from 'express';
import { login, logout } from '../controllers/authController.js';

const router = express.Router();

/** POST /api/auth/login
 * Returns JWT + user payload
 */
router.post('/login', login);

/** POST /api/auth/logout
 *  Logout, client removes stored token
 */
router.post('/logout', logout);

export default router;