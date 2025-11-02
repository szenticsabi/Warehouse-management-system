/** Test for product endpoint
 * Uses in-memory MongoDB and an express app
 */
import request from 'supertest';
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

describe('/api/product', () => {
  test('list returns items with populated fields', async () => {

    // List products
    const res = await request(app).get('/api/product/list');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const items = res.body.data;
    expect(Array.isArray(items)).toBe(true);

    // If there are items verify key fiels and populated refs
    if (items.length) {
      const p = items[0];
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('sku');
      expect(typeof p.price).toBe('number');
      expect(typeof p.stock).toBe('number');

      // Category should be populated with id and name
      expect(p).toHaveProperty('category');
      expect(p.category).toHaveProperty('id');
      expect(p.category).toHaveProperty('name');

      // warehouse shoul be populated with id and name
      expect(p).toHaveProperty('warehouse');
      expect(p.warehouse).toHaveProperty('id');
      expect(p.warehouse).toHaveProperty('name');
    }
  });
});

