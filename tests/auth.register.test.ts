import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/server.js';

describe('auth registration', () => {
  it('registers a restaurant with the documented contract', async () => {
    const suffix = Date.now();

    const response = await request(app)
      .post('/auth/register')
      .send({
        restaurantName: `Cafe Aroma ${suffix}`,
        restaurantEmail: `owner${suffix}@example.com`,
        restaurantPhone: '+2348000000000',
        address: '123 Test Street',
        ownerName: 'Ada Lovelace',
        ownerEmail: `owner${suffix}@example.com`,
        password: 'securepassword123',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Restaurant registered successfully.');
    expect(response.body.data).toMatchObject({
      token: expect.any(String),
      employee: expect.objectContaining({
        email: `owner${suffix}@example.com`,
        role: 'OWNER',
      }),
      restaurant: expect.objectContaining({
        name: `Cafe Aroma ${suffix}`,
        restaurantEmail: `owner${suffix}@example.com`,
        phone: '+2348000000000',
      }),
    });
  });
});
