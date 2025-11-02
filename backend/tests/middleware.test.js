/** Test for requireAuth and requireRole
 * Uses in-memory MongoDB and an express app
 */

import request from 'supertest';
import mongoose from 'mongoose';
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

// Log in and return jwt token
const loginAs = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
};

describe('middleware: requireAuth/requireRole', () => {
  test('no token -> 401', async () => {

    // Use random ObjectId as targer order id
    const dummyId = new mongoose.Types.ObjectId().toString();

    // Delete without authorization header should be rejected
    const res = await request(app).delete('/api/order/delete/' + dummyId);
    expect(res.status).toBe(401);
  });

  test('invalid token -> 401', async () => {
    const dummyId = new mongoose.Types.ObjectId().toString();

    // Invali token should be rejected
    const res = await request(app)
      .delete('/api/order/delete/' + dummyId)
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('employee cannot delete order -> 403', async () => {
    const dummyId = new mongoose.Types.ObjectId().toString();

    // Login as employee and try to hit an admin only endpoint
    const token = await loginAs('employee@warehouse.com', 'employee');
    const res = await request(app)
      .delete('/api/order/delete/' + dummyId)
      .set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(403);
  });
});

