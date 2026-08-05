import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

const API_PREFIX = "/api/v1";

describe("public loyalty", () => {
  it("returns public loyalty program and customer profile", async () => {
    const suffix = Date.now();
    const email = `public-loyalty-${suffix}@example.com`;

    // Register restaurant
    const register = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        restaurantName: `Cafe ${suffix}`,
        restaurantEmail: email,
        restaurantPhone: "+911234567890",
        address: "Test Address",
        ownerName: "Owner",
        ownerEmail: email,
        password: "Password123!",
      });

    expect(register.status).toBe(201);

    const token = register.body.data.accessToken;

    // Create table
    const table = await request(app)
      .post(`${API_PREFIX}/tables`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Table 1",
      });

    expect(table.status).toBe(201);

    const qrToken = table.body.data.qrCode;

    // Create category
    const category = await request(app)
      .post(`${API_PREFIX}/categories`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Coffee",
      });

    const categoryId = category.body.data.id;

    // Create menu item
    const menu = await request(app)
      .post(`${API_PREFIX}/menu`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        categoryId,
        name: "Latte",
        description: "Coffee",
        price: 200,
        foodType: "VEG",
      });

    const menuItemId = menu.body.data.id;

    // Enable loyalty
    await request(app)
      .put(`${API_PREFIX}/loyalty/program`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        rewardName: "Free Coffee",
        purchaseThreshold: 5,
        rewardQuantity: 1,
        minimumOrderValue: 100,
        isActive: true,
      });

    // Place order
    const order = await request(app)
      .post(`${API_PREFIX}/orders`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        tableId: table.body.data.id,
        customerPhone: "9999999999",
        items: [
          {
            menuItemId,
            quantity: 1,
          },
        ],
      });

    const orderId = order.body.data.id;

    // Complete order
    for (const status of [
      "CONFIRMED",
      "PREPARING",
      "READY",
      "COMPLETED",
    ]) {
      await request(app)
        .patch(`${API_PREFIX}/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status });
    }

    // Public loyalty program
    const program = await request(app).get(
      `${API_PREFIX}/public/loyalty/program/${qrToken}`,
    );

    expect(program.status).toBe(200);
    expect(program.body.data.rewardName).toBe("Free Coffee");

    // Public customer profile
    const customer = await request(app).get(
      `${API_PREFIX}/public/loyalty/customer/${qrToken}/9999999999`,
    );

    expect(customer.status).toBe(200);
    expect(customer.body.data.customer.phone).toBe("9999999999");
    expect(customer.body.data.progress.progressCount).toBe(1);
  }, 60000);
});