/** Test for warehouse endpoint
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

describe('/api/warehouse', () => {
  test('list returns 200 and array', async () => {

    // List warehouses
    const res = await request(app).get('/api/warehouse/list');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('add ok and duplicate name -> 409', async () => {

    // Create, should succeed
    const add = await request(app).post('/api/warehouse/add').send({ name: 'W1', address: 'Addr' });
    expect(add.status).toBe(201);

    // Create with same name should conflict
    const dup = await request(app).post('/api/warehouse/add').send({ name: 'W1', address: 'Addr2' });
    expect(dup.status).toBe(409);
  });

  test('view products: invalid id -> 400', async () => {

    // Invalid objectId most be rejected
    const res = await request(app).get('/api/warehouse/not-a-valid-id/products');
    expect(res.status).toBe(400);
  });

  test('delete ok and 404 when repeating', async () => {

    // Create a warehouse to delete
    const create = await request(app).post('/api/warehouse/add').send({ name: 'W2', address: '' });
    const id = create.body.data._id;

    // Delete, should succeed
    const del = await request(app).delete('/api/warehouse/delete/' +id);
    expect(del.status).toBe(200);

    // Delete again with same name should return 404
    const del2 = await request(app).delete('/api/warehouse/delete/' +id);
    expect(del2.status).toBe(404);
  });
});

