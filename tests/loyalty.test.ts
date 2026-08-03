import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

const API_PREFIX = "/api/v1";

describe("loyalty flow", () => {
  it("creates a loyalty program and awards a reward after a completed order", async () => {
    const suffix = Date.now();
    const restaurantEmail = `loyalty${suffix}@example.com`;

    const registerResponse = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        restaurantName: `Loyalty Cafe ${suffix}`,
        restaurantEmail,
        restaurantPhone: "+2348000000000",
        address: "123 Test Street",
        ownerName: "Ada Lovelace",
        ownerEmail: restaurantEmail,
        password: "SecurePassword123!",
      });

    expect(registerResponse.status).toBe(201);
    const token = registerResponse.body.data.accessToken;

    const tableResponse = await request(app)
      .post(`${API_PREFIX}/tables`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Table ${suffix}` });

    expect(tableResponse.status).toBe(201);
    const tableId = tableResponse.body.data.id;

    const categoryResponse = await request(app)
      .post(`${API_PREFIX}/categories`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Drinks ${suffix}` });

    expect(categoryResponse.status).toBe(201);
    const categoryId = categoryResponse.body.data.id;

    const menuResponse = await request(app)
      .post(`${API_PREFIX}/menu`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        categoryId,
        name: `Coffee ${suffix}`,
        description: "Premium coffee",
        price: 120,
        foodType: "VEG",
        isAvailable: true,
      });

    expect(menuResponse.status).toBe(201);
    const menuItemId = menuResponse.body.data.id;

    const programResponse = await request(app)
      .put(`${API_PREFIX}/loyalty/program`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        rewardName: "Free Coffee",
        purchaseThreshold: 2,
        rewardQuantity: 1,
        minimumOrderValue: 100,
        isActive: true,
      });

    expect(programResponse.status).toBe(200);
    expect(programResponse.body.data.rewardName).toBe("Free Coffee");

    const orderResponse = await request(app)
      .post(`${API_PREFIX}/orders`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        tableId,
        customerPhone: "+2348123456789",
        items: [{ menuItemId, quantity: 1 }],
      });

    expect(orderResponse.status).toBe(201);
    const orderId = orderResponse.body.data.id;

    const confirmResponse = await request(app)
      .patch(`${API_PREFIX}/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONFIRMED" });

    expect(confirmResponse.status).toBe(200);

    const prepareResponse = await request(app)
      .patch(`${API_PREFIX}/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "PREPARING" });

    expect(prepareResponse.status).toBe(200);

    const readyResponse = await request(app)
      .patch(`${API_PREFIX}/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "READY" });

    expect(readyResponse.status).toBe(200);

    const completeResponse = await request(app)
      .patch(`${API_PREFIX}/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "COMPLETED" });

    expect(completeResponse.status).toBe(200);

    const customerResponse = await request(app)
      .get(`${API_PREFIX}/loyalty/customers/+2348123456789`)
      .set("Authorization", `Bearer ${token}`);

    expect(customerResponse.status).toBe(200);
    expect(customerResponse.body.data.progress.progressCount).toBe(1);
    expect(customerResponse.body.data.rewards).toHaveLength(0);
  }, 60000);
});
