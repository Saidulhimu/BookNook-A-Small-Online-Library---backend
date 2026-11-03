# 📚 BookNook Server API

Backend server for **BookNook – A Small Online Library**, built with **Express.js**, **MongoDB**, and **JWT Authentication**.

## 🚀 Live Server URL
- **Production Server:** `https://booknook-backend.onrender.com` (Or deployed Render / Vercel instance)
- **Local Server:** `http://localhost:5001`

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

### Authentication
Login, registration and Google sign-in are handled in the Next.js app with BetterAuth (MongoDB adapter). The frontend exchanges its session for a JWT; this server only **verifies** that JWT (`Authorization: Bearer <token>`) with the shared `JWT_SECRET`. A health check is available at `GET /`.

---|---|---|---|
| `POST` | `/auth/register` | Public | Create an account (bcrypt-hashed password) |
| `POST` | `/auth/login` | Public | Verify credentials and issue a JWT |
| `GET` | `/auth/me` | Private | Current user from the token |
| `POST` | `/auth/logout` | Public | Clear authentication cookie |
| `GET` | `/` | Public | Health check route |

---

## ⚙️ Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
DB_NAME=booknook
JWT_SECRET=your_jwt_secret_key   # must match JWT_SECRET in the frontend .env
CLIENT_URL=http://localhost:3000
```

---

## 📦 Installation & Running Locally

To fill an empty database with sample books run `npm run seed` (safe to re-run, it only adds missing titles).


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

