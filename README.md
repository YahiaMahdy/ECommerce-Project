# ECommerce Project

A full-featured RESTful API for an e-commerce platform built with Node.js and Express. This project provides comprehensive functionality for managing products, categories, shopping carts, and orders with MongoDB as the persistence layer.

## Table of Contents

- [Features](#features)
- [Stack](#stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Development](#development)

## Features

- **Product Management**: Create, read, update, and delete products with category association
- **Category Management**: Organize products into categories with descriptions
- **Shopping Cart**: Add/remove items, manage quantities, and track cart status
- **Order Management**: Create orders from cart items with automatic order number generation and status tracking
- **Data Validation**: Comprehensive input validation and error handling
- **MongoDB Integration**: Persistent data storage with Mongoose ODM
- **Security**: MongoDB injection prevention with express-mongo-sanitize
- **Environment Configuration**: Support for multiple environments (development, production)

## Stack

- **Language**: JavaScript (Node.js)
- **Runtime**: Node.js
- **Framework**: Express.js 4.22.2
- **Database**: MongoDB with Mongoose 9.7.3
- **Security**: express-mongo-sanitize 2.2.0
- **Development**: nodemon 3.1.14
- **Configuration**: dotenv 17.4.2

## Project Structure

```
├── app.js                 # Express application entry point
├── seed.js               # Database seeding script
├── package.json          # Project dependencies and scripts
├── .env.example          # Environment variables template
├── config/
│   └── config.js         # Configuration management
├── db/
│   └── connect.js        # MongoDB connection setup
├── models/
│   ├── category.model.js # Category schema and model
│   ├── product.model.js  # Product schema and model
│   ├── order.model.js    # Order schema with auto-generation
│   └── cart.model.js     # Cart schema with status tracking
├── controllers/
│   ├── category.controller.js  # Category business logic
│   ├── product.controller.js   # Product CRUD operations
│   ├── order.controller.js     # Order processing
│   └── cart.controller.js      # Cart operations
├── routes/
│   ├── category.routes.js  # Category endpoints
│   ├── products.routes.js  # Product endpoints
│   ├── orders.routes.js    # Order endpoints
│   └── cart.routes.js      # Cart endpoints
├── middleware/
│   ├── errorHandler.js    # Global error handling
│   └── asyncHandler.js    # Async error wrapper
└── utils/
    └── AppError.js        # Custom error class
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote instance)
- npm or yarn

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

Edit `.env` file with your settings:

```env
PORT=3000
NODE_ENV=production
MONGO_URI=mongodb://username:password@host:27017/ecommerce
```

### Configuration Variables

- **PORT**: Server port (default: 3000)
- **NODE_ENV**: Environment type (development/production)
- **MONGO_URI**: MongoDB connection string (required)

The `config/config.js` file validates that `MONGO_URI` is provided and will throw an error if missing.

## Running the Project

### Start Development Server

With live reload using nodemon:

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

### Seed Database

Populate the database with initial categories and products:

```bash
npm run seed
```

This will:
- Clear existing data (Categories, Products, Orders, Carts)
- Insert 4 categories (electronics, furniture, stationery, kitchen)
- Insert 7 sample products across categories
- Output seeding results to console

## API Endpoints

### Categories

- `GET /api/categories` - Retrieve all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Replace entire category
- `PATCH /api/categories/:id` - Update category fields
- `DELETE /api/categories/:id` - Delete category

### Products

- `GET /api/products` - Retrieve all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Replace entire product
- `PATCH /api/products/:id` - Update product fields
- `DELETE /api/products/:id` - Delete product

### Cart

- `GET /api/cart` - Retrieve cart
- `POST /api/cart` - Create new cart
- `PUT /api/cart/:id` - Update cart
- `PATCH /api/cart/:id` - Update cart items
- `DELETE /api/cart/:id` - Delete cart

### Orders

- `GET /api/orders` - Retrieve all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id` - Partially update order
- `DELETE /api/orders/:id` - Delete order

## Data Models

### Category

```javascript
{
  name: String (required, unique, trimmed),
  description: String (optional),
  timestamps: { createdAt, updatedAt }
}
```

### Product

```javascript
{
  name: String (required, unique, trimmed),
  category: ObjectId (required, ref: 'Category'),
  price: Number (required, min: 0),
  stock: Number (required, min: 0, default: 0),
  inStock: Boolean (default: true),
  timestamps: { createdAt, updatedAt }
}
```

### Order

```javascript
{
  orderNumber: String (auto-generated, format: ORD-YYYYMMDD-XXXX),
  customerName: String (required, trimmed),
  shippingAddress: String (required, trimmed),
  items: [
    {
      product: ObjectId (ref: 'Product'),
      name: String,
      quantity: Number (min: 1),
      price: Number (min: 0)
    }
  ],
  totalPrice: Number (required, min: 0),
  status: String (enum: ['pending', 'confirmed', 'delivered'], default: 'pending'),
  timestamps: { createdAt, updatedAt }
}
```

### Cart

```javascript
{
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

## Error Handling

The application includes comprehensive error handling with:

- **Validation Errors** (400): Invalid input data
- **Cast Errors** (400): Invalid MongoDB ObjectId
- **Duplicate Key Errors** (409): Unique constraint violations
- **Not Found Errors** (404): Resource not found
- **Internal Server Errors** (500): Unexpected errors

### Error Response Format

```json
{
  "status": "fail|error",
  "statusCode": 400,
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

## Development

### Project Scripts

```bash
npm start           # Run production server
npm run dev         # Run development server with nodemon
npm run seed        # Seed database with sample data
```

### Key Technologies

- **Express.js**: Lightweight web framework
- **Mongoose**: MongoDB object modeling
- **dotenv**: Environment variable management
- **express-mongo-sanitize**: NoSQL injection prevention
- **nodemon**: Auto-restart during development

### Best Practices

- Input validation on all endpoints
- Proper HTTP status codes
- Error messages for all failure cases
- Environment-based configuration
- Database connection error handling
- Async/await for asynchronous operations

## Author

YahiaMahdy
