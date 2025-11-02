/** Test for toorder endpoint
 * Uses in-memory MongoDB and an express app
 */

import request from 'supertest';
import ToOrder from '../models/toOrder.js';
import Product from '../models/Product.js';
import { createApp, startMemoryServerAndConnect, closeDatabase, seedBasicData } from './utils/setup.js';

let app;
let mongoServer;

// Start in-memory MongoDB and connect mongoose
beforeAll(async () => {
  mongoServer = await startMemoryServerAndConnect();
  app = createApp();
});

// Reset contents to a minimal seed before each test
beforeEach(async () => {
  await seedBasicData();
});

// Drop database, close Mongoose, stop in-memory server
afterAll(async () => {
  await closeDatabase(mongoServer);
});

describe('/api/toorder', () => {
  test('list returns populated product info', async () => {

    // Listing toOrders
    const res = await request(app).get('/api/toorder/list');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const items = res.body.data;
    expect(Array.isArray(items)).toBe(true);

    // If at least one item exist check populated fields
    if (items.length) {
      const t = items[0];
      expect(t).toHaveProperty('product');
      expect(t.product).toHaveProperty('name');
      expect(t.product).toHaveProperty('sku');
      expect(t.product).toHaveProperty('category');
      expect(t.product).toHaveProperty('warehouse');
    }
  });

  test('add-many upsert does not duplicate pending for same product', async () => {

    // Find a product and count current pending docs for it
    const product = await Product.findOne().lean();
    const before = await ToOrder.countDocuments({ product: product._id, status: 'pending' });

    // Same product id twice (upsert should avoid duplicate pending)
    const res = await request(app)
      .post('/api/toorder/add-selection')
      .send({ ids: [product._id.toString(), product._id.toString()] });

    expect(res.status).toBe(201);
    const after = await ToOrder.countDocuments({ product: product._id, status: 'pending' });

    // Already ha one in see, stays one
    expect(after - before).toBe(0);
  });

  test('update', async () => {

    // Find one existing toOrder doc
    const doc = await ToOrder.findOne().lean();
    const id = doc._id.toString();

    // Update status and stock
    const res = await request(app)
      .put('/api/toorder/update/' +id)
      .send({ status: 'ordered', stock: 15 });
    
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ordered', stock: 15 });
  });

  test('delete', async () => {

    // Find one existing toOrder doc
    const doc = await ToOrder.findOne().lean();
    const id = doc._id.toString();

    // Delete and checking if its gone
    const res = await request(app).delete('/api/toorder/delete/' +id);
    expect(res.status).toBe(200);
    
    const again = await ToOrder.findById(id).lean();
    expect(again).toBeNull();
  });
});

