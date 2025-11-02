import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

// App routes
import authRoutes from '../../routes/auth.js';
import categoryRoutes from '../../routes/cat.js';
import productRoutes from '../../routes/productmodify.js';
import orderRoutes from '../../routes/ordermodify.js';
import toOrderRoutes from '../../routes/toordermodify.js';
import userRoutes from '../../routes/usermodify.js';
import warehouseRoutes from '../../routes/warehousemodify.js';
import adminSummaryRoutes from '../../routes/adminsummary.js';

// Models for seeding and verification
import User from '../../models/User.js';
import Category from '../../models/Category.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import Warehouse from '../../models/Warehouse.js';
import ToOrder from '../../models/toOrder.js';

// Created an Express app wired with all API routes
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/category', categoryRoutes);
  app.use('/api/product', productRoutes);
  app.use('/api/order', orderRoutes);
  app.use('/api/toorder', toOrderRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/warehouse', warehouseRoutes);
  app.use('/api/admin', adminSummaryRoutes);
  return app;
};

// Starts an in-memory MongoDB and connects to it
const startMemoryServerAndConnect = async () => {

  // Ensure JWT exist
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_secret_123';
  }
  // Disable MD5 check to avoid flaky downloads on some environments
  if (!process.env.MONGOMS_DISABLE_MD5_CHECK) {
    process.env.MONGOMS_DISABLE_MD5_CHECK = '1';
  }
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  return mongoServer;
};

// Drops database, closes Mongoose and stops in-memory server
const closeDatabase = async (mongoServer) => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
};

// Reset collections an seeds minimal datasets for tests
const seedBasicData = async () => {
  // Clean collections
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Warehouse.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    ToOrder.deleteMany({}),
  ]);

  // Users
  const adminPassword = await bcrypt.hash('admin', 10);
  const empPassword = await bcrypt.hash('employee', 10);
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@warehouse.com',
    password: adminPassword,
    role: 'admin',
    shift: 'morning',
  });
  const employee = await User.create({
    name: 'Employee',
    email: 'employee@warehouse.com',
    password: empPassword,
    role: 'employee',
    shift: 'morning',
  });

  // Category + Warehouse
  const category = await Category.create({ id: 1, name: 'Test category', description: 'Used category for tests' });
  const warehouse = await Warehouse.create({ id: 1, name: 'Test Central Warehouse', address: 'Test ST 1' });

  // Products
  const product1 = await Product.create({
    name: 'Monitor_test',
    sku: 'MON001',
    price: 120,
    stock: 11,
    category: category._id,
    warehouse: warehouse._id,
  });
  const product2 = await Product.create({
    name: 'Laptop_test',
    sku: 'LAP002',
    price: 8500,
    stock: 2,
    category: category._id,
    warehouse: warehouse._id,
  });

  // Order with two items
  const order = await Order.create({
    id: 1,
    items: [
      { product: product1._id, qty: 2, status: 'pending' },
      { product: product2._id, qty: 1, status: 'pending' },
    ],
  });

  // One ToOrder doc
  const toOrderItem = await ToOrder.create({ product: product1._id, stock: 0, status: 'pending' });

  return { admin, employee, category, warehouse, product1, product2, order, toOrderItem };
};

export { createApp, startMemoryServerAndConnect, closeDatabase, seedBasicData }
