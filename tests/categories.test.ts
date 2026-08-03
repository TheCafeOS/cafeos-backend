import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from "../src/app.js";

const API_PREFIX = "/api/v1";

describe('categories routes', () => {
  it('requires authentication for category listing', async () => {
    const response = await request(app).get(`${API_PREFIX}/categories`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });
});
