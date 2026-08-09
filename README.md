# ☕ CafeOS

> The Operating System for Modern Restaurants

CafeOS is a production-oriented Restaurant Management SaaS platform designed to digitize and simplify restaurant operations through QR-based ordering, real-time order management, employee access control, loyalty programs, notifications, dashboards, and restaurant configuration.

Customers can scan a table QR code, browse the restaurant's menu, place an order, provide their phone number for loyalty tracking, and follow their order status without installing an application.

Restaurant staff can manage tables, menus, orders, employees, restaurant branding, notifications, and loyalty programs from a centralized dashboard.

The backend is designed with scalability, maintainability, security, and multi-tenant SaaS architecture in mind.

---

# 🌐 Live Demo

### Frontend

https://cafeos-ten.vercel.app

### Backend API

https://cafeos-backend-cjc2.onrender.com

### Swagger Documentation

https://cafeos-backend-cjc2.onrender.com/api-docs

---

# ✨ Features

## 👨‍💼 Restaurant & Employee Management

- Restaurant registration and authentication
- Employee authentication
- Employee management
- Role-Based Access Control (RBAC)
- `OWNER`, `MANAGER`, and `STAFF` roles
- Owner-only employee management operations
- Employee activation/deactivation
- Secure password hashing
- Change password functionality

---

## 🎨 Restaurant Branding & Settings

Restaurants can customize their digital presence through:

- Restaurant logo
- Cover image
- Tagline
- Description
- Cuisine type
- Website
- Instagram
- Facebook
- Custom links
- Theme color

Image assets are managed through Cloudinary.

---

## 🍽 Menu Management

- Category CRUD
- Menu item CRUD
- Menu item availability toggle
- Menu item image upload
- Image replacement
- Automatic old image deletion
- Cloudinary integration
- Public QR-based menu
- Restaurant-specific menu isolation

---

## 🪑 Table & QR Management

- Table CRUD
- Table status management
- Dynamic QR tokens
- QR code generation
- QR PNG generation
- QR-based public menu access
- QR-based public ordering
- Inactive table protection

Customers interact with a restaurant through the QR code assigned to their table.

---

## 🛒 Order Management

CafeOS supports the complete restaurant order lifecycle.

### Customer Ordering

- QR-based ordering
- Public order creation without authentication
- Customer phone number support
- Menu item availability validation
- Quantity validation
- Automatic order total calculation
- Order tracking

### Restaurant Order Management

- Restaurant order creation
- Public order creation
- Order listing
- Order details
- Pagination
- Status filtering
- Table filtering
- Customer phone/search filtering
- Date range filtering
- Sorting by creation date, status, or total

### Order Lifecycle

~~~text
PENDING
   │
   ▼
CONFIRMED
   │
   ▼
PREPARING
   │
   ▼
COMPLETED

   └──────► CANCELLED
~~~

Order status transitions are validated by the backend to prevent invalid state changes.

---

## ⚡ Real-Time Order Updates

CafeOS uses Socket.IO for real-time communication.

### Restaurant

Restaurants receive real-time events when:

- A new order is created
- An order status changes

### Customers

Customers can receive real-time updates for their table/order.

The socket architecture uses restaurant-specific and table-specific rooms to isolate real-time events between restaurants.

---

## 🔔 Notifications

CafeOS includes a backend notification system for important restaurant events.

Currently, the notification panel focuses specifically on:

### `NEW_ORDER`

When a new customer order is created:

1. Order is stored.
2. A `NEW_ORDER` notification is created.
3. The notification is broadcast in real time.
4. Restaurant staff can see it in the notification panel.

Order status events such as `PREPARING`, `COMPLETED`, and `CANCELLED` are not added to the notification feed because these changes are already visible on the Orders page.

Notification features include:

- Create notification
- List notifications
- Read notification
- Delete notification
- Real-time notification broadcasting

---

## ⭐ Loyalty Program

CafeOS includes a restaurant-level customer loyalty system.

### Loyalty Features

- Loyalty program creation
- Loyalty program configuration
- Customer creation/lookup by phone number
- Customer loyalty progress
- Automatic progress on completed orders
- Reward tracking
- Public loyalty program API
- Public customer loyalty profile API

### Customer Flow

~~~text
Customer provides phone number
             │
             ▼
Customer is created / found
             │
             ▼
Order is placed
             │
             ▼
Order becomes COMPLETED
             │
             ▼
Loyalty progress is updated
             │
             ▼
Reward is awarded when threshold is reached
~~~

---

## 📊 Dashboard

The backend provides dashboard APIs for restaurant operations.

- Today's statistics
- Revenue summary
- Recent orders
- Orders by status
- Dashboard summary
- Order counts
- Operational metrics

---

## 📝 Audit Logs

CafeOS records important restaurant operations through audit logging.

Examples include:

- Order creation
- Order status changes
- Employee-related operations

Audit records contain relevant information such as:

- Restaurant
- Employee
- Action
- Entity
- Entity ID
- Metadata

This provides an operational history for restaurant activity and accountability.

---

## 🔐 Security & Protection

CafeOS implements multiple backend security mechanisms:

- JWT authentication
- Access tokens
- Refresh tokens
- Role-Based Access Control
- Secure password hashing
- Helmet security headers
- CORS configuration
- Zod request validation
- API rate limiting
- Authentication rate limiting
- Public order rate limiting
- Request IDs
- Centralized error handling
- Restaurant-level data isolation

### Rate Limiting

General API requests are protected using rate limiting.

Authentication endpoints use stricter rate limits to reduce brute-force attempts.

Public ordering endpoints are also protected against excessive request traffic.

---

## 📄 API Documentation

CafeOS provides interactive API documentation using Swagger/OpenAPI.

The API is organized into modules including:

- Authentication
- Public
- Employees
- Tables
- Categories
- Menu
- Orders
- Dashboard
- Settings
- Loyalty
- Notifications

---

# 🏗 Tech Stack

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Neon
- Socket.IO
- JWT
- Cloudinary
- Zod
- Swagger / OpenAPI
- Pino Logger
- Express Rate Limit

---

## Frontend

- Next.js
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- React Query
- Zustand
- Axios
- Socket.IO Client

---

# 🏛 System Architecture

~~~text
                         ┌──────────────────────────┐
                         │        Customers         │
                         │                          │
                         │      QR Menu / Order     │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌───────────────────────────────────────────────────────────────┐
│                       CafeOS Backend                          │
│                                                               │
│  Express.js + TypeScript                                      │
│                                                               │
│  ┌────────────┐   ┌────────────┐   ┌────────────────────┐     │
│  │Controllers │──►│  Services  │──►│ Prisma / PostgreSQL│     │
│  └────────────┘   └────────────┘   └────────────────────┘     │
│         │                 │                                   │
│         ▼                 ▼                                   │
│  ┌────────────┐   ┌────────────────┐                          │
│  │ Validation │   │ Business Logic │                          │
│  │   (Zod)    │   │                │                          │
│  └────────────┘   └────────────────┘                          │
│                                                               │
│  Authentication │ RBAC │ Audit │ Notifications │ Rate Limit   │
│                                                               │
└───────────────┬───────────────────────┬───────────────────────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │   Socket.IO   │       │   Cloudinary  │
        │ Real-time     │       │ Image Storage │
        └───────────────┘       └───────────────┘
                │
                ▼
        ┌─────────────────┐
        │ Restaurant      │
        │ Dashboard       │
        │ Next.js         │
        └─────────────────┘
~~~

---

# 🔄 Customer Order Flow

~~~text
Customer
   │
   ▼
Scan Table QR
   │
   ▼
Validate QR Token
   │
   ▼
Browse Public Menu
   │
   ▼
Select Items
   │
   ▼
Enter Phone Number (Optional)
   │
   ▼
Place Order
   │
   ▼
Order Created as PENDING
   │
   ├──────────────► NEW_ORDER Notification
   │
   ▼
Restaurant Staff
   │
   ▼
Accept / Confirm Order
   │
   ▼
PREPARING
   │
   ▼
COMPLETED
   │
   └──────────────► Loyalty Progress Updated
~~~

---

# 📦 API Modules

~~~text
Authentication
Employees
Public
Tables
Categories
Menu
Orders
Dashboard
Settings
Loyalty
Notifications
~~~

---

# 📂 Project Structure

~~~text
src
├── config
├── constants
├── controllers
├── docs
├── lib
├── middleware
├── routes
├── services
├── utils
├── validations
├── app.ts
└── server.ts
~~~

### Architectural Responsibilities

~~~text
Routes
   │
   ▼
Validation Middleware
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
~~~

Controllers remain thin while business logic is handled inside services.

---

# 🧪 Testing

CafeOS includes automated API/integration tests using Vitest.

Current verified test suite:

~~~text
Test Files: 7 passed
Tests:      8 passed
~~~

The test suite covers important flows including:

- Authentication
- Categories
- Public APIs
- Health endpoint
- Loyalty
- Notifications
- Public loyalty

---

# 🚀 Getting Started

## Clone Repository

~~~bash
git clone https://github.com/Mayank1343/cafeos-backend.git

cd cafeos-backend
~~~

---

## Install Dependencies

~~~bash
npm install
~~~

---

## Environment Variables

Create a `.env` file:

~~~env
DATABASE_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PORT=4000

CORS_ORIGINS=
~~~

Set `CORS_ORIGINS` according to your frontend/deployment environments.

---

## Generate Prisma Client

~~~bash
npx prisma generate
~~~

---

## Run Database Migrations

~~~bash
npx prisma migrate dev
~~~

---

## Start Development Server

~~~bash
npm run dev
~~~

---

## Run Tests

~~~bash
npm test
~~~

---

## Build

~~~bash
npm run build
~~~

---

# 📖 API Documentation

Once the backend is running locally:

~~~text
http://localhost:4000/api-docs
~~~

Production Swagger documentation:

https://cafeos-backend-cjc2.onrender.com/api-docs

---

# 🛣 Roadmap

## ✅ Completed

### Core Platform

- Authentication
- JWT Access Tokens
- Refresh Tokens
- Role-Based Access Control
- Employee Management
- Restaurant Settings
- Restaurant Branding

### Restaurant Operations

- Table Management
- QR Code Generation
- QR PNG Generation
- Categories
- Menu Management
- Menu Image Uploads
- Cloudinary Integration
- Order Management
- Order Status Workflow
- Dashboard APIs
- Pagination
- Search
- Filtering
- Sorting

### Customer Experience

- Public QR Menu
- Public QR Ordering
- Customer Phone Association
- Order Tracking
- Real-Time Order Updates
- Loyalty Programs
- Loyalty Progress
- Rewards

### Real-Time & Notifications

- Socket.IO
- Restaurant Rooms
- Table Rooms
- Real-Time New Order Events
- New Order Notifications
- Notification Management

### Security & Production Hardening

- Request IDs
- Structured Logging
- Rate Limiting
- Authentication Rate Limiting
- Public Order Rate Limiting
- Zod Validation
- Helmet
- CORS
- Centralized Error Handling
- Audit Logs
- Swagger/OpenAPI

---

## 🔜 Planned

- Kitchen Display System (KDS)
- Inventory Management
- Discounts & Coupons
- Billing & Invoicing
- Advanced Analytics & Reports
- Payment Gateway Integration
- Subscription & SaaS Billing
- Multi-Restaurant SaaS Expansion

---

# 🎯 Design Principles

CafeOS follows a layered architecture focused on maintainability, security, and scalability.

- Thin Controllers
- Business Logic in Services
- Prisma Access Only Inside Services
- Zod Request Validation
- RESTful APIs
- Modular Architecture
- Stateless JWT Authentication
- Structured Logging
- Centralized Error Handling
- Restaurant-Level Data Isolation
- Explicit Order State Transitions
- Production-Oriented Security
- Backend Independent of Frontend Implementation

---

# 🤝 Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run the test suite.
5. Run the production build.
6. Commit your changes.
7. Open a Pull Request.

For major changes, please open an issue first to discuss your proposal.

---

# 📜 License

This project is proprietary software.

The source code is publicly available for portfolio and evaluation purposes only. All rights are reserved by the author.

---

# 👨‍💻 Author

**Mayank Sharma**

GitHub: https://github.com/Mayank1343

---

# ⭐ Support

If you found CafeOS useful or interesting, consider giving the repository a **Star ⭐**.

It helps others discover the project and supports continued development.
