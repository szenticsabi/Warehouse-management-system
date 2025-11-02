/** Test for user endpoint
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

describe('/api/user', () => {
  test('list returns 200 and array', async () => {

    // List the users
    const res = await request(app).get('/api/user/list');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('add user ok and duplicate email -> 409', async () => {

    // First create should succeed
    const create = await request(app)
      .post('/api/user/add')
      .send({ name: 'U1', email: 'u1@example.com', password: 'pw', role: 'employee', shift: 'morning' });
    expect(create.status).toBe(201);

    // Second should conflict
    const dup = await request(app)
      .post('/api/user/add')
      .send({ name: 'U1b', email: 'u1@example.com', password: 'pw' });
    expect(dup.status).toBe(409);
  });

  test('delete user works and non-existent -> 404', async () => {

    // Create a user to delete
    const create = await request(app)
      .post('/api/user/add')
      .send({ name: 'U2', email: 'u2@example.com', password: 'pw' });
    
    const id = create.body.data._id;

    // Delete the user, should succeed
    const del = await request(app).delete(`/api/user/delete/${id}`);
    expect(del.status).toBe(200);

    // Delete fail, should return 404
    const delAgain = await request(app).delete(`/api/user/delete/${id}`);
    expect(delAgain.status).toBe(404);
  });
});

