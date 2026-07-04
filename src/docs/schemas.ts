export const schemas = {
  RegisterRequest: {
    type: "object",
    required: [
      "restaurantName",
      "restaurantEmail",
      "restaurantPhone",
      "address",
      "ownerName",
      "ownerEmail",
      "password",
    ],
    properties: {
      restaurantName: {
        type: "string",
        example: "CafeOS Demo",
      },
      restaurantEmail: {
        type: "string",
        format: "email",
        example: "contact@cafeos.com",
      },
      restaurantPhone: {
        type: "string",
        example: "+91 9876543210",
      },
      address: {
        type: "string",
        example: "123 Main Street, Dehradun",
      },
      ownerName: {
        type: "string",
        example: "John Doe",
      },
      ownerEmail: {
        type: "string",
        format: "email",
        example: "john@example.com",
      },
      password: {
        type: "string",
        minLength: 12,
        maxLength: 128,
        description:
          "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        example: "StrongPassword123!",
      },
    },
  },

  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "john@example.com",
      },
      password: {
        type: "string",
        example: "StrongPassword123!",
      },
    },
  },
};