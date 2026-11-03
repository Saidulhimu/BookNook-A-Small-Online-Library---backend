# 📚 BookNook Server API

Backend server for **BookNook – A Small Online Library**, built with **Express.js**, **MongoDB**, and **JWT Authentication**.

## 🚀 Live Server URL
- **Production Server:** `https://booknook-backend.onrender.com` (Or deployed Render / Vercel instance)
- **Local Server:** `http://localhost:5000`

---

## 🛠️ Features & Highlights
- **RESTful Architecture:** 8 strictly implemented endpoints for books and borrows management.
- **JWT Protection:** Token verification middleware for all private mutations and user-specific queries.
- **Available Copies Challenge:** Atomic `$inc: { totalCopies: -1 }` on borrow and `$inc: { totalCopies: 1 }` on return.
- **No Double Borrow Challenge:** Prevents users from having multiple active borrows of the same book.
- **Ownership Verification:** Only the user who created a book can update or delete it.
- **Clean Error Handling:** Centralized middleware returning informative JSON errors.

---

## 📡 API Endpoints Specification

### Books Endpoints
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/books` | Public | Get all books (supports `sort=newest`, `limit=6`, `category`, `search`, `userEmail`) |
| `GET` | `/books/:id` | Public | Get single book details by MongoDB ObjectId |
| `POST` | `/books` | Private (JWT) | Add a new book (stores title, author, category, image, description, totalCopies) |
| `PATCH` | `/books/:id` | Private (JWT) | Update existing book (owner only) |
| `DELETE` | `/books/:id` | Private (JWT) | Delete book and its related borrow records (owner only) |

### Borrow System Endpoints
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/borrows` | Private (JWT) | Borrow a book (verifies copies > 0, prevents double borrow, decrements copy) |
| `GET` | `/borrows` | Private (JWT) | Get all active borrows for the authenticated user |
| `DELETE` | `/borrows/:id` | Private (JWT) | Return a borrowed book and increment book copies back by 1 |

### Authentication & Token Endpoints
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/jwt` | Public | Sign and issue a JWT token upon client login |
| `POST` | `/logout` | Public | Clear authentication cookie |
| `GET` | `/` | Public | Health check route |

---

## ⚙️ Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=booknook
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

---

## 📦 Installation & Running Locally

1. Clone repository:
   ```bash
   git clone https://github.com/Saidulhimu/BookNook-A-Small-Online-Library---backend.git
   cd BookNook-A-Small-Online-Library---backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Run in production:
   ```bash
   npm start
   ```
