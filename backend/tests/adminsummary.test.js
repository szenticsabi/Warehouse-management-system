/** Test for the Admin summary endpoint
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

describe('/api/admin/summary', () => {
  test('returns cards and latestOrders', async () => {

    // call the summary endpoint
    const res = await request(app).get('/api/admin/summary');

    // success flag and basic shape
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('cards');
    expect(res.body.data).toHaveProperty('latestOrders');
  });
});
