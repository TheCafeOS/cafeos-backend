import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

const API_PREFIX = "/api/v1";

describe("public APIs", () => {
  it("returns 404 for an invalid QR token", async () => {
    const response = await request(app).get(`${API_PREFIX}/public/menu/invalid-token`);
    expect(response.status).toBe(404);
  });
});
