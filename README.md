# API Response Wrapper 🚀

[![npm version](https://img.shields.io/npm/v/api-response-wrapper.svg)](https://www.npmjs.com/package/api-response-wrapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, framework-agnostic utility to standardize your API responses. Ensure consistent JSON structures across your entire project, complete with built-in pagination helpers and error handling.

## ✨ Features

- **Standardized Structure**: Every response follows a predictable format (`success`, `statusCode`, `message`, `data`, `errors`, `timestamp`, `meta`).
- **Framework Agnostic**: Works perfectly with Express, Fastify, Koa, or even plain Node.js and Browser environments.
- **TypeScript Support**: Full type safety with generic support for your data models.
- **Smart Pagination**: Built-in array pagination helper with automatic metadata generation.
- **Modern Build**: Supports both ESM and CommonJS.

---

## 📦 Installation

```bash
npm install api-response-wrapper
```

---

## 🚀 Usage Examples

### Using with Express.js

Standardize your route completions with ease.

```typescript
import express from 'express';
import { ResponseWrapper, paginateArray } from 'api-response-wrapper';

const app = express();

app.get('/users', (req, res) => {
  try {
    const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    
    // Using the pagination helper
    const paginated = paginateArray(users, 1, 10);
    
    // Return a standardized success response
    return res.status(200).json(
      ResponseWrapper.success(paginated.data, 200, 'Users fetched successfully', paginated.meta)
    );
  } catch (error) {
    return res.status(500).json(
      ResponseWrapper.error(500, 'Failed to fetch users')
    );
  }
});
```

### Using with Vanilla JavaScript (Browser or Node)

Perfect for clients or simple utility scripts.

```javascript
import { ResponseWrapper } from 'api-response-wrapper';

function handleAPI() {
  const data = { profile: 'Antigravity' };
  
  const response = ResponseWrapper.success(data, 201, 'Profile Created');
  
  console.log(response);
  /*
  {
    success: true,
    statusCode: 201,
    message: 'Profile Created',
    data: { profile: 'Antigravity' },
    errors: null,
    timestamp: '2024-04-15T...',
  }
  */
}
```

---

## 📖 API Reference

### `ResponseWrapper` Class

#### `static success<T>(data, statusCode?, message?, meta?)`
Returns a success response object.
- **data**: The payload of the response.
- **statusCode**: (Optional) HTTP status code (default: 200).
- **message**: (Optional) Description message (default: 'Success').
- **meta**: (Optional) Pagination metadata object.

#### `static error(statusCode?, message?, errors?)`
Returns an error response object.
- **statusCode**: (Optional) HTTP status code (default: 500).
- **message**: (Optional) Error message (default: 'An error occurred').
- **errors**: (Optional) Detailed error object or array.

---

### `paginateArray<T>(items, page?, limit?)`
A utility function to slice an array and generate pagination metadata.
- **items**: The full array of items to paginate.
- **page**: Current page number (default: 1).
- **limit**: Items per page (default: 10).

**Returns**: `{ data: T[], meta: PaginationMeta }`

---

### `ApiError` Class
A custom Error class that includes a `statusCode` and `errors` field.

```typescript
throw new ApiError(404, 'User not found');
```

---

## 🛠️ Data Interfaces

### `PaginationMeta`
```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  totalElements?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}
```

---

## 📄 License

MIT © Chamodya Ganegamage
