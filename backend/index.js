/** Entry point for the API server
 * Loads env, set up Express with Cors and Json parsing
 * Mounts feature routes under /api/*
 * Starts HTTP server and MongoDB connection
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './database/connection.js';

// Route modules
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/cat.js';
import userRoutes from './routes/usermodify.js';
import warehouseRoutes from './routes/warehousemodify.js';
import orderRoutes from './routes/ordermodify.js';
import productRoutes from './routes/productmodify.js';
import toOrderRoutes from './routes/toordermodify.js';
import adminSummaryRoutes from './routes/adminsummary.js';


// Load .env
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/user', userRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/product', productRoutes);
app.use('/api/toorder', toOrderRoutes);
app.use('/api/admin', adminSummaryRoutes);

// Port config
const PORT = process.env.PORT || 3000;

// Start HTTP server, connect database and log status
app.listen(PORT, () => {
    connectDB();
    console.log('Server is running on http://localhost:' +PORT);
})