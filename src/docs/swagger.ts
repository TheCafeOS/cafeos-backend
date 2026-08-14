import swaggerJsdoc from "swagger-jsdoc";
import { components } from "./index.js";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",

    info: {
      title: "CafeOS API",
      version: "1.0.0",
      description:
        "REST API for CafeOS — The Operating System for Modern Restaurants.",
      contact: {
        name: "CafeOS",
      },
      license: {
        name: "Proprietary",
      },
    },

    servers: [
      {
        url: "http://localhost:4000/api/v1",
        description: "Local Development",
      },
    ],

    tags: [
      {
        name: "Health",
        description: "Application health endpoints",
      },
      {
        name: "Authentication",
        description: "Restaurant and employee authentication",
      },
      {
        name: "Public",
        description: "Public QR ordering APIs",
      },
      {
        name: "Tables",
        description: "Restaurant table management",
      },
      {
        name: "Categories",
        description: "Menu category management",
      },
      {
        name: "Menu",
        description: "Menu item management",
      },
      {
        name: "Orders",
        description: "Restaurant order management",
      },
      {
        name: "Dashboard",
        description: "Restaurant dashboard APIs",
      },
      {
        name: "Settings",
        description: "Restaurant settings management",
      },
      {
        name: "Loyalty",
        description: "Loyalty programs, customer profiles, and reward redemption",
      },
      {
        name: "Notifications",
        description: "Notification management APIs",
      },
      {
        name: "Offers",
        description:
          "Restaurant discount offers and promotions",
      },
    ],

    components: {
      ...components,
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [
    "./src/routes/*.ts",
  ],
});