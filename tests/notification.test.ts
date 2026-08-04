import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

const API_PREFIX = "/api/v1";

describe("notification flow", () => {
  it("creates, lists, reads and deletes notifications", async () => {
    const suffix = Date.now();

    const restaurantEmail = `notification${suffix}@example.com`;

    const registerResponse = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        restaurantName: `Notification Cafe ${suffix}`,
        restaurantEmail,
        restaurantPhone: "+2348000000000",
        address: "123 Test Street",
        ownerName: "Ada Lovelace",
        ownerEmail: restaurantEmail,
        password: "SecurePassword123!",
      });

    expect(registerResponse.status).toBe(201);

    const token =
      registerResponse.body.data.accessToken;

    const tableResponse = await request(app)
      .post(`${API_PREFIX}/tables`)
      .set(
        "Authorization",
        `Bearer ${token}`,
      )
      .send({
        name: `Table ${suffix}`,
      });

    expect(tableResponse.status).toBe(201);

    const tableId =
      tableResponse.body.data.id;

    const categoryResponse =
      await request(app)
        .post(`${API_PREFIX}/categories`)
        .set(
          "Authorization",
          `Bearer ${token}`,
        )
        .send({
          name: `Drinks ${suffix}`,
        });

    expect(categoryResponse.status).toBe(201);

    const categoryId =
      categoryResponse.body.data.id;

    const menuResponse = await request(app)
      .post(`${API_PREFIX}/menu`)
      .set(
        "Authorization",
        `Bearer ${token}`,
      )
      .send({
        categoryId,
        name: `Coffee ${suffix}`,
        description: "Premium coffee",
        price: 120,
        foodType: "VEG",
        isAvailable: true,
      });

    expect(menuResponse.status).toBe(201);

    const menuItemId =
      menuResponse.body.data.id;

    const orderResponse = await request(app)
      .post(`${API_PREFIX}/orders`)
      .set(
        "Authorization",
        `Bearer ${token}`,
      )
      .send({
        tableId,
        customerPhone: "+2348123456789",
        items: [
          {
            menuItemId,
            quantity: 1,
          },
        ],
      });

    expect(orderResponse.status).toBe(201);

    //
    // Notification should exist
    //

    const listResponse = await request(app)
      .get(`${API_PREFIX}/notifications`)
      .set(
        "Authorization",
        `Bearer ${token}`,
      );

    expect(listResponse.status).toBe(200);

    expect(
      listResponse.body.data.length,
    ).toBeGreaterThan(0);

    expect(
      listResponse.body.pagination,
    ).toBeDefined();

    const notification =
      listResponse.body.data[0];

    expect(notification.type).toBe(
      "NEW_ORDER",
    );

    //
    // Filter by type
    //

    const filteredResponse =
      await request(app)
        .get(
          `${API_PREFIX}/notifications?type=NEW_ORDER`,
        )
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(filteredResponse.status).toBe(200);

    expect(
      filteredResponse.body.data.every(
        (notification: any) =>
          notification.type ===
          "NEW_ORDER",
      ),
    ).toBe(true);

    //
    // unread count
    //

    const unreadResponse =
      await request(app)
        .get(
          `${API_PREFIX}/notifications/unread-count`,
        )
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(unreadResponse.status).toBe(200);

    expect(
      unreadResponse.body.data.count,
    ).toBeGreaterThan(0);

    //
    // mark one read
    //

    const readResponse = await request(app)
      .patch(
        `${API_PREFIX}/notifications/${notification.id}/read`,
      )
      .set(
        "Authorization",
        `Bearer ${token}`,
      );

    expect(readResponse.status).toBe(200);

    expect(
      readResponse.body.data.isRead,
    ).toBe(true);

    expect(
      readResponse.body.data.readAt,
    ).toBeTruthy();

    //
    // mark all read
    //

    const readAllResponse =
      await request(app)
        .patch(
          `${API_PREFIX}/notifications/read-all`,
        )
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(readAllResponse.status).toBe(200);

    expect(
      readAllResponse.body.data.count,
    ).toBeGreaterThanOrEqual(0);

    //
    // delete notification
    //

    const deleteResponse =
      await request(app)
        .delete(
          `${API_PREFIX}/notifications/${notification.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(deleteResponse.status).toBe(204);

    //
    // should not exist anymore
    //

    const deleteAgain =
      await request(app)
        .delete(
          `${API_PREFIX}/notifications/${notification.id}`,
        )
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(deleteAgain.status).toBe(404);
  }, 60000);

  it("returns 401 without authentication", async () => {
    const response = await request(app).get(
      `${API_PREFIX}/notifications`,
    );

    expect(response.status).toBe(401);
  });
});