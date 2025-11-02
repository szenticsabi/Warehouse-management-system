import express from 'express';
import { listUsers, addUser, updateUser, deleteUser } from '../controllers/userController.js';
const router = express.Router();

/** GET /api/user/list
 *  List users
 */
router.get('/list', listUsers);

/** POST /api/user/add
 * Create user
 */
router.post('/add', addUser);

/** PUT /api/user/update/:id
 * Update user by MongoDB _id
 */
router.put('/update/:id', updateUser);

/** DELETE /api/user/delete/:id
 * Delete uer by MongoDB _id
 */
router.delete('/delete/:id', deleteUser);

export default router;