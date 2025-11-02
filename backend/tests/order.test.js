/** Test for order endpoint
 * Uses in-memory MongoDB and an express app
 */

import request from 'supertest';
import Order from '../models/Order.js';
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

// Login and return JWT token
const loginAs = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
};

describe('/api/order', () => {
  test('list includes derivedStatus', async () => {

    // Return array of orders with derivedStatus
    const res = await request(app).get('/api/order/list');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const items = res.body.data;
    expect(Array.isArray(items)).toBe(true);
    if (items.length) {
      expect(items[0]).toHaveProperty('derivedStatus');
    }
  });

  test('update saves items and derivedStatus becomes fulfilled', async () => {

    // Load a seeded order and mark the items fulfilled
    const existing = await Order.findOne().lean();
    const id = existing._id.toString();
    const updatedItems = existing.items.map((it) => ({ ...it, status: 'fulfilled' }));

    // Should persist items and recompute derivedStatus
    const res = await request(app)
      .put('/api/order/update/' + id)
      .send({ items: updatedItems });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('derivedStatus', 'fulfilled');
    expect(res.body.data.items.every((i) => i.status === 'fulfilled')).toBe(true);
  });

  test('delete only admin can delete', async () => {

    // Grab a real order id from database
    const existing = await Order.findOne().lean();
    const id = existing._id.toString();

    // Employee token -> forbidden
    const empToken = await loginAs('employee@warehouse.com', 'employee');
    const forb = await request(app)
      .delete('/api/order/delete/' + id)
      .set('Authorization', 'Bearer ' + empToken);
    expect(forb.status).toBe(403);

    // Admin token -> ok
    const admToken = await loginAs('admin@warehouse.com', 'admin');
    const ok = await request(app)
      .delete('/api/order/delete/' + id)
      .set('Authorization', 'Bearer ' + admToken);
    expect(ok.status).toBe(200);
  });
});

