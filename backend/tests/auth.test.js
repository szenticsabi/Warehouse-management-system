/** Test for login endpoint
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

describe('/api/auth/login', () => {
  test('success with correct credentials', async () => {

    // Login as admin
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@warehouse.com', password: 'admin' });

    // Expect ok, token, and the admin role on the returned user
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: 'admin@warehouse.com', role: 'admin' });
  });

  test('invalid password returns 401', async () => {

    // Check wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@warehouse.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('non-existent user returns 401', async () => {

    // Check existence of the user
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nouser@warehouse.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('User not found');
  });
});

