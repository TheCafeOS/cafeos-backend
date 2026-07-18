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

RefreshTokenRequest: {
  type: "object",
  required: ["refreshToken"],
  properties: {
    refreshToken: {
      type: "string",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  },
},

Employee: {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    restaurantId: {
      type: "string",
      format: "uuid",
    },
    email: {
      type: "string",
      format: "email",
      example: "owner@example.com",
    },
    role: {
      type: "string",
      enum: [
        "OWNER",
        "MANAGER",
        "STAFF",
      ],
      example: "OWNER",
    },
  },
},


RefreshTokenResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    message: {
      type: "string",
      example: "Access token refreshed.",
    },
    data: {
      type: "object",
      properties: {
        accessToken: {
          type: "string",
          description: "JWT access token",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  },
},

ErrorResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: false,
    },
    message: {
      type: "string",
      example: "Invalid credentials",
    },
    requestId: {
      type: "string",
      format: "uuid",
    },
  },
},

Restaurant: {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    name: {
      type: "string",
      example: "CafeOS Demo",
    },
    slug: {
      type: "string",
      example: "cafeos-demo",
    },
    restaurantEmail: {
      type: "string",
      format: "email",
    },
    phone: {
      type: "string",
      nullable: true,
    },
    address: {
      type: "string",
      nullable: true,
    },

    logoUrl: {
      type: "string",
      nullable: true,
      example: "https://res.cloudinary.com/demo/logo.png",
    },

    coverImageUrl: {
      type: "string",
      nullable: true,
      example: "https://res.cloudinary.com/demo/cover.jpg",
    },

    tagline: {
      type: "string",
      nullable: true,
      example: "Fresh Coffee Everyday",
    },

    description: {
      type: "string",
      nullable: true,
      example: "Modern café serving handcrafted beverages.",
    },

    cuisineType: {
      type: "string",
      nullable: true,
      example: "Cafe",
    },

    website: {
      type: "string",
      nullable: true,
      example: "https://cafeos.com",
    },

    instagram: {
      type: "string",
      nullable: true,
      example: "https://instagram.com/cafeos",
    },

    facebook: {
      type: "string",
      nullable: true,
      example: "https://facebook.com/cafeos",
    },

    customLink: {
      type: "string",
      nullable: true,
      example: "https://linktr.ee/cafeos",
    },

    themeColor: {
      type: "string",
      nullable: true,
      example: "#F97316",
    },
  },
},

LoginResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    message: {
      type: "string",
      example: "Login successful.",
    },
    data: {
      type: "object",
      properties: {
        accessToken: {
          type: "string",
          description: "JWT access token",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        refreshToken: {
          type: "string",
          description: "JWT refresh token",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        employee: {
          $ref: "#/components/schemas/Employee",
        },
      },
    },
  },
},

RegisterResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    message: {
      type: "string",
      example: "Restaurant registered successfully.",
    },
    data: {
      type: "object",
      properties: {
      accessToken: {
        type: "string",
        description: "JWT access token",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
        refreshToken: {
          type: "string",
          description: "JWT refresh token",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        employee: {
          $ref: "#/components/schemas/Employee",
        },
        restaurant: {
          $ref: "#/components/schemas/Restaurant",
        },
      },
    },
  },
},

CreateOrderRequest: {
  type: "object",
  required: ["tableId", "items"],
  properties: {
    tableId: {
      type: "string",
      example: "cmf8abc123xyz",
    },
    customerPhone: {
      type: "string",
      nullable: true,
      example: "+919876543210",
    },
    items: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["menuItemId", "quantity"],
        properties: {
          menuItemId: {
            type: "string",
            example: "cmf8menu123xyz",
          },
          quantity: {
            type: "integer",
            minimum: 1,
            example: 2,
          },
        },
      },
    },
  },
},

UpdateOrderStatusRequest: {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ],
      example: "CONFIRMED",
    },
  },
},

CreateTableRequest: {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      example: "Table 1",
    },
  },
},

UpdateTableRequest: {
  type: "object",
  properties: {
    name: {
      type: "string",
      example: "VIP Table",
    },
    status: {
      type: "string",
      enum: [
        "AVAILABLE",
        "OCCUPIED",
        "RESERVED",
        "INACTIVE",
      ],
      example: "AVAILABLE",
    },
  },
},

CreateCategoryRequest: {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      example: "Beverages",
    },
  },
},

UpdateCategoryRequest: {
  type: "object",
  properties: {
    name: {
      type: "string",
      example: "Hot Beverages",
    },
  },
},

CreateMenuItemRequest: {
  type: "object",
  required: ["name", "price"],
  properties: {
    categoryId: {
      type: "string",
      nullable: true,
      example: "cmf8cat123",
    },
    name: {
      type: "string",
      example: "Margherita Pizza",
    },
    description: {
      type: "string",
      example: "Classic cheese pizza",
    },
    price: {
      type: "number",
      example: 299,
    },
    isAvailable: {
      type: "boolean",
      example: true,
    },
  },
},

UpdateMenuItemRequest: {
  type: "object",
  properties: {
    categoryId: {
      type: "string",
      nullable: true,
    },
    name: {
      type: "string",
    },
    description: {
      type: "string",
    },
    price: {
      type: "number",
    },
    isAvailable: {
      type: "boolean",
    },
  },
},

PublicOrderSummary: {
  type: "object",
  properties: {
    id: {
      type: "string",
      example: "cmf8abc123xyz",
    },
    status: {
      type: "string",
      enum: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ],
    },
    total: {
      type: "number",
      example: 499,
    },
    table: {
      type: "string",
      nullable: true,
      example: "Table 5",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
  },
},

PublicOrderSummaryResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    message: {
      type: "string",
      example: "Order created successfully",
    },
    data: {
      $ref: "#/components/schemas/PublicOrderSummary",
    },
  },
},

PublicOrder: {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    status: {
      type: "string",
      enum: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ],
    },
    total: {
      type: "number",
    },
    customerPhone: {
      type: "string",
      nullable: true,
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          quantity: {
            type: "integer",
          },
          price: {
            type: "number",
          },
          menuItem: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              name: {
                type: "string",
              },
              price: {
                type: "number",
              },
            },
          },
        },
      },
    },
  },
},

PublicOrderResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    message: {
      type: "string",
      example: "Order fetched successfully",
    },
    data: {
      $ref: "#/components/schemas/PublicOrder",
    },
  },
},

ChangePasswordRequest: {
  type: "object",
  required: ["currentPassword", "newPassword"],
  properties: {
    currentPassword: {
      type: "string",
      example: "OldPassword123!",
    },
    newPassword: {
      type: "string",
      minLength: 12,
      maxLength: 128,
      description:
        "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      example: "NewPassword123!",
    },
  },
},

SettingsUpdateRequest: {
  type: "object",
  properties: {
    name: {
      type: "string",
      example: "CafeOS Demo",
    },
    restaurantEmail: {
      type: "string",
      format: "email",
      example: "contact@cafeos.com",
    },
    phone: {
      type: "string",
      example: "+91 9876543210",
    },
    address: {
      type: "string",
      example: "123 Main Street, Dehradun",
    },

    tagline: {
      type: "string",
      example: "Fresh Coffee Everyday",
    },

    description: {
      type: "string",
      example: "Modern café serving handcrafted beverages.",
    },

    cuisineType: {
      type: "string",
      example: "Cafe",
    },

    website: {
      type: "string",
      example: "https://cafeos.com",
    },

    instagram: {
      type: "string",
      example: "https://instagram.com/cafeos",
    },

    facebook: {
      type: "string",
      example: "https://facebook.com/cafeos",
    },

    customLink: {
      type: "string",
      example: "https://linktr.ee/cafeos",
    },

    themeColor: {
      type: "string",
      example: "#F97316",
    },
  },
},

SettingsResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    message: {
      type: "string",
      example: "Settings fetched successfully.",
    },
    data: {
      type: "object",
      properties: {
        restaurant: {
          $ref: "#/components/schemas/Restaurant",
        },
        owner: {
          $ref: "#/components/schemas/Employee",
        },
      },
    },
  },
},
};