/** Test for /api/category/:id/products
 * Uses in-memory MongoDB and an express app
 */
import request from 'supertest';
import Category from '../models/Category.js';
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

describe('/api/category/:id/products', () => {
  test('invalid id -> 400', async () => {

    // Call with a non-ObjectId string
    const res = await request(app).get('/api/category/not-an-id/products');

    // Controller should return 400 for invalid id
    expect(res.status).toBe(400);
  });

  test('valid id -> returns array', async () => {

    // Pick a real category
    const cat = await Category.findOne().lean();

    // Query products from category
    const res = await request(app).get(`/api/category/${cat._id.toString()}/products`);

    // Responds 200 with an array payload
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
