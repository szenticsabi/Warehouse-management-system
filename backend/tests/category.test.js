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

describe('/api/category', () => {
  test('list', async () => {

    // Get all categories
    const res = await request(app).get('/api/category/list');

    // Expect OK with basic fields
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('name');
  });

  test('add', async () => {

    // Create category
    const res = await request(app)
      .post('/api/category/add')
      .send({ categoryName: 'Books', categoryDescription: 'All books' });

    // Expect 201 + created fields + id and _id
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: 'Books', description: 'All books' });
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('_id');
  });

  test('update', async () => {

    // Create then update by MongoDb _id
    const create = await request(app)
      .post('/api/category/add')
      .send({ categoryName: 'Temp', categoryDescription: 'T' });
    const id = create.body.data._id;
    const res = await request(app)
      .put('/api/category/update/' + id)
      .send({ categoryName: 'Updated', categoryDescription: 'U' });

    // Expect 200 + updated fields
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Updated', description: 'U' });
  });

  test('delete', async () => {

    // Create and delete by MongoDB _id
    const create = await request(app)
      .post('/api/category/add')
      .send({ categoryName: 'Temp2', categoryDescription: 'T2' });
    const id = create.body.data._id;
    const res = await request(app).delete('/api/category/delete/' + id);

    // Expect OK and success flag
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

