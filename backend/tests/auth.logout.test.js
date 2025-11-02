/** Test for the logout endpoint
 *  Uses in-memory MongoDB and an express app
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

describe('/api/auth/logout', () => {
  test('returns 200 success', async () => {

    // Call logout endpoint
    const res = await request(app).post('/api/auth/logout');

    // Status and success flag
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
