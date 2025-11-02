import express from 'express';
import { addCategory, deleteCategory, listCategories, updateCategory, getCategoryProducts } from '../controllers/categoryController.js';
const router = express.Router();

/** GET /api/category/list
 * List all categories
 */
router.get('/list', listCategories);

/** POST /api/category/add
 * Add category, server giving the category 'id'
 */
router.post('/add', addCategory);

/** PUT /api/category/update/:id
 * Update category by MongoDB _id
 */
router.put('/update/:id', updateCategory);

/** DELETE /api/category/delete/:id
 * Delete category by MongoDB _id
 */
router.delete('/delete/:id', deleteCategory);

/** GET /api/category/:id/products
 * List the products of the category by category MongoDB _id
 */
router.get('/:id/products', getCategoryProducts);

export default router;