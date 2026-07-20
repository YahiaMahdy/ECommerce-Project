# [ECommerce Project](https://github.com/YahiaMahdy/ECommerce-Project)

A full-featured RESTful API for an e-commerce platform built with Node.js and Express. It covers products, categories, shopping carts, and orders, with JWT-based authentication and role-based authorization (customer/admin) on top, and MongoDB (via Mongoose) as the persistence layer.

## Table of Contents

- [Features](#features)
- [Stack](#stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Authentication & Authorization](#authentication--authorization)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Postman Documentation](#postman-documentation)
- [Known Implementation Notes](#known-implementation-notes)
- [Development](#development)

## Features

- **Authentication & Roles**: JWT-based register/login with `customer`/`admin` roles and rate-limited login
- **Product Management**: Full CRUD with category association, image URLs, and filterable listings
- **Category Management**: Organize products into categories with descriptions; deletion is blocked while products still reference a category
- **Shopping Cart**: Per-user carts with stock-aware add/update/remove, ownership checks, and status tracking
- **Order & Checkout**: Orders are created directly from a cart - stock is re-validated and reduced, prices/names are snapshotted, and the cart is cleared in one atomic-ish flow
- **Data Validation**: Comprehensive input validation and centralized error handling
- **Security**: MongoDB injection prevention (`express-mongo-sanitize`), bcrypt password hashing, JWT auth, and rate limiting on login
- **Environment Configuration**: Support for multiple environments (development, production)

## Stack

- **Language / Runtime**: JavaScript (Node.js)
- **Framework**: Express.js 4.22.2
- **Database**: MongoDB with Mongoose 9.7.3
- **Auth**: jsonwebtoken 9.0.2, bcrypt 5.1.1
- **Security**: express-mongo-sanitize 2.2.0, express-rate-limit 7.4.0
- **Development**: nodemon 3.1.14
- **Configuration**: dotenv 17.4.2

## Project Structure

```
├── app.js                    # Express application entry point
├── seed.js                   # Database seeding script (categories, products, users)
├── package.json               # Project dependencies and scripts
├── .env.example                # Environment variables template
├── config/
│   └── config.js              # Configuration management (throws if MONGO_URI/JWT_SECRET missing)
├── db/
│   └── connect.js             # MongoDB connection setup
├── models/
│   ├── category.model.js      # Category schema
│   ├── product.model.js       # Product schema (incl. images, inStock)
│   ├── order.model.js         # Order schema (orderNumber auto-generation, user-scoped)
│   ├── cart.model.js          # Cart schema (user-scoped, status tracking)
│   └── user.model.js          # User schema (bcrypt password hashing, roles)
├── controllers/
│   ├── auth.controller.js     # Register / login
│   ├── category.controller.js # Category business logic
│   ├── product.controller.js  # Product CRUD + filtering
│   ├── order.controller.js    # Checkout / order processing
│   └── cart.controller.js     # Cart operations
├── routes/
│   └── v1/
│       ├── auth.routes.js
│       ├── category.routes.js
│       ├── products.routes.js
│       ├── orders.routes.js
│       └── cart.routes.js
├── middleware/
│   ├── auth.js                # `protect` - verifies the JWT, loads req.user
│   ├── role.js                # `restrictTo(...roles)` / `adminOnly`
│   ├── rateLimiter.js         # authLimiter (10/15min, /api/v1/auth) + generalLimiter (100/15min, everything)
│   ├── errorHandler.js        # Global error handling
│   └── asyncHandler.js        # Async error wrapper
├── utils/
│   ├── AppError.js            # Custom error class
│   └── generateToken.js       # Signs a JWT for a given user id
└── postman/
    └── collection.json        # Self-contained - baseUrl/categoryId/productId/orderId live as collection variables
```

## Installation

### Prerequisites

- Node.js (LTS recommended; no `engines` field is pinned in `package.json`)
- MongoDB (local or remote instance)
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YahiaMahdy/ECommerce-Project.git
   cd ECommerce-Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment configuration**
   ```bash
   cp .env.example .env
   ```

## Configuration

Edit `.env` with your settings:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://username:password@host:27017/ecommerce
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=1h
```

### Configuration Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port the server listens on |
| `NODE_ENV` | No | `development` | `development` includes the error `stack` in responses |
| `MONGO_URI` | **Yes** | - | App throws at boot if missing |
| `JWT_SECRET` | **Yes** | - | App throws at boot if missing |
| `JWT_EXPIRES_IN` | No | `1h` | Any [`ms`](https://github.com/vercel/ms)-style string, e.g. `1h`, `7d` |
| `VERSION` | No | - | Present in `.env.example` but not currently read by `config/config.js` - API versioning is hardcoded as `/api/v1` in `app.js` instead |

## Running the Project

### Development (live reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

### Seed the Database

```bash
npm run seed
```

This clears `Orders`, `Cart`, `Product`, `Category`, and `User` collections, then inserts:
- 4 categories (electronics, furniture, stationery, kitchen)
- 7 sample products across those categories
- 2 users:
  - `admin@example.com` / `AdminPass123` (role: `admin`)
  - `jane@example.com` / `CustomerPass123` (role: `customer`)

**Seeding first is effectively required** for anything admin-only (creating categories/products, etc.) - registration always creates `customer`-role accounts, so the seeded admin is the only way to get an admin token without manually editing the database.

## Authentication & Authorization

- The whole API is versioned under `/api/v1` (e.g. `/api/v1/products`, `/api/v1/auth/login`).
- `POST /api/v1/auth/register` and `POST /api/v1/auth/login` are public. Both return `{ token, user }` on success.
- Every other route family requires `Authorization: Bearer <token>` **except** `GET` on Categories and Products, which are public.
- `role` is never accepted from the request body on register - all self-registered accounts are `customer`. The only `admin` account comes from `seed.js`.
- Two authorization layers are used:
  - **`protect`** (`middleware/auth.js`): verifies the JWT, loads the user, attaches `req.user`. Returns `401` if the token is missing, invalid, expired, or the user no longer exists.
  - **`adminOnly`** (`middleware/role.js`): requires `req.user.role === 'admin'`. Returns `403` otherwise.
- **Ownership checks** (done inside the controllers, not middleware): a `customer` can only read/modify their own carts and orders; an `admin` can access any of them. Attempting to touch another user's cart/order returns `403`.
- **Two rate limiters** (`middleware/rateLimiter.js`):
  - `generalLimiter` - 100 requests / 15 minutes per IP, applied to **every** route.
  - `authLimiter` - 10 requests / 15 minutes per IP, applied in front of the whole `/api/v1/auth` router - so it now covers `register` as well as `login`, not just `login`.
  - Both return `429` with a `{ status, message }` body when tripped; `authLimiter`'s body also includes `statusCode: 429`, `generalLimiter`'s currently doesn't (minor inconsistency between the two).

| Resource | Public | Any logged-in user | Admin only |
|---|---|---|---|
| Categories | `GET /`, `GET /:id` | - | `POST`, `PATCH /:id`, `DELETE /:id` |
| Products | `GET /`, `GET /:id` | - | `POST`, `PUT /:id`, `PATCH /:id`, `DELETE /:id` |
| Cart | - | everything (own carts only; admin sees/edits all) | - |
| Orders | - | `GET /`, `GET /:id`, `POST /` (own carts only; admin sees/edits all) | `PATCH /:id/status` |

## API Endpoints

### Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | `name, email, password, address` | `password` min 8 chars; always creates a `customer`; shares the authLimiter bucket below |
| POST | `/api/v1/auth/login` | `email, password` | Rate-limited (10/15min/IP, shared with `/register`) |

### Categories

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/categories` | Public | List all |
| GET | `/api/v1/categories/:id` | Public | 404 if missing |
| POST | `/api/v1/categories` | Admin | `name` required (unique) |
| PATCH | `/api/v1/categories/:id` | Admin | Partial update |
| DELETE | `/api/v1/categories/:id` | Admin | 400 if any product still references it |

### Products

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/products` | Public | Paginated - see below |
| GET | `/api/v1/products/:id` | Public | `category` populated with `name, description` |
| POST | `/api/v1/products` | Admin | Validates `category` exists (404 if not); `name, category, price, stock` required |
| PUT | `/api/v1/products/:id` | Admin | **Full replace** from `name, category, price, stock` only - see [Known Implementation Notes](#known-implementation-notes) |
| PATCH | `/api/v1/products/:id` | Admin | Partial update |
| DELETE | `/api/v1/products/:id` | Admin | |

`GET /api/v1/products` returns `data: { products: [...], pagination: { total, page, limit, totalPages } }` - **not** a bare array. It does **not** populate `category` (raw id only); only `GET /:id` does.

Query params (combinable):

| Param | Example | Behavior |
|---|---|---|
| `page` / `limit` | `?page=2&limit=20` | `limit` capped at 50, defaults: `page=1`, `limit=10` |
| `sortBy` / `order` | `?sortBy=price&order=asc` | `sortBy` one of `price, name, createdAt, stock` (default `createdAt`); `order` `asc`/`desc` (default `desc`); anything else silently falls back to the default rather than erroring |
| `fields` | `?fields=name,price` | Whitelist projection - only `name, category, price, stock, inStock` are selectable; unrecognized names are dropped, and an entirely-invalid list falls back to returning every field except `__v` |
| `category` | `?category=<id>` | Exact category match |
| `minPrice` / `maxPrice` | `?minPrice=100&maxPrice=500` | `price` range (inclusive) |
| `inStock` | `?inStock=true` | Filters on the stored `inStock` boolean directly (`true`/anything else) - **not** derived from live `stock`; nothing in the codebase keeps it in sync with `stock` changes, so it can drift over time |
| `search` | `?search=laptop` | Case-insensitive match on `name` |

### Cart

All routes require a Bearer token. A customer only sees/modifies their own carts; an admin can access any cart.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/cart` | Own carts (all carts if admin) |
| GET | `/api/v1/cart/:id` | 403 if not yours |
| POST | `/api/v1/cart` | Creates an empty (or pre-seeded) cart tied to the logged-in user - no `customerName` needed, it's taken from the token |
| POST | `/api/v1/cart/:id/items` | `{ productId, quantity }` - validates stock, increments quantity if already present |
| PATCH | `/api/v1/cart/:id/items/:productId` | `{ quantity }` - re-validates stock |
| DELETE | `/api/v1/cart/:id/items/:productId` | Removes one line item |
| DELETE | `/api/v1/cart/:id/items` | Clears the whole cart (items → `[]`, `totalPrice` → `0`) |
| PATCH | `/api/v1/cart/:id/status` | `{ status }` - must be one of the enum values |

### Orders & Checkout

All routes require a Bearer token.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/orders` | Any user | Own orders (all orders if admin) |
| GET | `/api/v1/orders/:id` | Any user | 403 if not yours (unless admin) |
| POST | `/api/v1/orders` | Any user | The checkout endpoint - see below |
| PATCH | `/api/v1/orders/:id/status` | Admin | Validates against the status enum |

`POST /api/v1/orders` body: `{ cartId, shippingAddress? }`

- `cartId` is required (400 if missing); `shippingAddress` is **optional** - if omitted, it falls back to the logged-in user's registered `address`.
- Looks up the cart (404 if missing, 403 if it belongs to someone else and you're not an admin, 400 if empty, 400 if not `active`).
- Re-validates stock for every line against the *current* product stock (not what it was when added to the cart) - 400 if insufficient.
- Computes `totalPrice` server-side and snapshots each item's `name`/`price` at checkout time (so later price changes don't retroactively change past orders).
- Decrements `Product.stock` for every purchased item.
- Creates the `Order` with an auto-generated `orderNumber` (`ORD-YYYYMMDD-####`) and `status: 'pending'`.
- Clears the cart (`items: []`, `totalPrice: 0`) and marks it `checked_out`.

There is no separate "checkout a cart" endpoint - `POST /api/v1/orders` **is** the checkout flow.

## Data Models

### User

```javascript
{
  name: String (required, trimmed),
  email: String (required, unique, lowercase, validated format),
  password: String (required, min 8 chars, bcrypt-hashed, never returned by default),
  address: String (required, trimmed),
  role: String (enum: ['customer', 'admin'], default: 'customer'),
  timestamps: { createdAt, updatedAt }
}
```

### Category

```javascript
{
  name: String (required, unique, trimmed),
  description: String (optional),
  slug: String (optional, unique, trimmed),
  timestamps: { createdAt, updatedAt }
}
```

### Product

```javascript
{
  name: String (required, unique, trimmed),
  description: String (default: ''),
  category: ObjectId (required, ref: 'Category'),
  price: Number (required, min: 0),
  stock: Number (required, min: 0, default: 0),
  inStock: Boolean (default: true),         
  images: [String] (required),               
  timestamps: { createdAt, updatedAt }
}
```

### Cart

```javascript
{
  user: ObjectId (required, ref: 'User', indexed),
  customerName: String (required, trimmed),   
  items: [
    {
      product: ObjectId (ref: 'Product'),
      quantity: Number (min: 1, default: 1),
      price: Number (min: 0)                 
    }
  ],
  totalPrice: Number (default: 0, min: 0),
  status: String (enum: ['active', 'checked_out', 'abandoned'], default: 'active'),
  timestamps: { createdAt, updatedAt }
}
```

### Order

```javascript
{
  orderNumber: String (auto-generated, format: ORD-YYYYMMDD-####, unique),
  user: ObjectId (required, ref: 'User', indexed),
  customerName: String (required, trimmed),
  shippingAddress: String (required, trimmed),
  items: [
    {
      product: ObjectId (ref: 'Product'),
      name: String (required),                
      quantity: Number (min: 1),
      price: Number (min: 0)                
    }
  ],
  totalPrice: Number (required, min: 0),
  status: String (enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending'),
  timestamps: { createdAt, updatedAt }
}
```

## Error Handling

Every error response (from `middleware/errorHandler.js`) has the same shape:

```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Human-readable description",
  "stack": "Only present when NODE_ENV=development"
}
```

| Source | Status | Example message |
|---|---|---|
| `AppError` thrown in a controller | whatever it was constructed with | varies |
| Mongoose `ValidationError` | 400 | `Validation failed: <first field error>` |
| Mongoose `CastError` (bad ObjectId) | 400 | `Invalid _id: <value>` |
| Duplicate key (`code 11000`) | 409 | `<field> already exists` |
| `JsonWebTokenError` (malformed/invalid token) | 401 | `Invalid token` |
| `TokenExpiredError` | 401 | `Token has expired` |
| Rate limit exceeded | 429 | `Too many login attempts. Please try again in 15 minutes.` (authLimiter) or `Too many requests, please try again later.` (generalLimiter) |
| Unmatched route | 404 | `Can't find <method + path>` |
| Anything unexpected | 500 | `Internal Server Error` |

## Postman Documentation

`postman/collection.json` is a single self-contained request collection covering every endpoint in the API (Auth, Categories, Products, Cart, Orders, plus a 404 sanity check), organized into folders that run top-to-bottom as an actual integration test:

- Each `POST`/`PATCH` request has its JSON body included directly in the request.
- Each request has a `pm.test()` script asserting the expected status code (and, for most, response shape).
- Each request has one saved example response (visible in Postman's "Examples" panel) covering both the success path and the specific error branch that request targets - missing/invalid input, `401` (no token), `403` (wrong role or wrong owner), `404`, `409`, and rate-limit `429`.
- `baseUrl`, `categoryId`, `productId`, and `orderId` live as **collection variables** (Collection → Variables tab) - no separate environment file is needed. IDs/tokens produced by early requests (e.g. `adminToken`, `customerToken`, `cartId`) are captured into collection variables by test scripts and reused by later requests, so the whole collection can be run via **Collection Runner** in one pass.

### To use it

1. In Postman: **Import** `postman/collection.json` (`File > Import`, or drag it in).
2. If your server isn't on `http://localhost:3000`, edit `baseUrl` under the collection's **Variables** tab.
3. Run `npm run seed` so the seeded admin account exists.
4. Run the collection top-to-bottom (Collection Runner, or just click through folders in order: **Auth → Categories → Products → Cart → Orders & Checkout → Misc → Cleanup**) - later requests depend on tokens/IDs captured by earlier ones.

A couple of things worth knowing before you run it:
- `/api/v1/auth` (register + login share one bucket) is rate-limited (10/15min/IP); the collection uses ~6 of those 10 per run, so running the *entire* collection more than ~twice within 15 minutes can trip it on later Auth requests - that's the API working as designed, not a bug in the collection.
- Categories/products created by the collection are timestamped in their names (`{{$timestamp}}`) specifically so re-running the whole collection from the top doesn't collide with the unique-name indexes on those two models.
- The saved response examples are accurate reconstructions based on reading the current source code (no route to a live MongoDB instance was available to capture literal responses from while building this). If you want byte-exact captures for a grading checklist, run the collection once against your dev server and use Postman's **"Save Response → Save as Example"** to overwrite any of them.

## Development

### Scripts

```bash
npm start           # Production server
npm run dev          # Development server with nodemon
npm run seed          # Seed the database with sample categories/products/users
```

### Best Practices Followed

- Input validation on all endpoints, with centralized error formatting
- Consistent `{ status, message, data }` success envelope
- JWT auth + role-based + ownership-based authorization
- Two-tier rate limiting: a general limiter on every route plus a stricter one on the auth endpoints most worth protecting (register/login)
- Async/await throughout, wrapped in a shared `asyncHandler` so no route needs its own try/catch
- Environment-based configuration with fail-fast checks for required secrets

## Author

YahiaMahdy