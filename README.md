# Role-Based Auth Monorepo (NestJS + Next.js)

A full-stack monorepo with a NestJS backend and a Next.js frontend implementing JWT auth (access + refresh), MongoDB (Mongoose), and role-based access control (admin/user).

## Stack
- Backend: NestJS 11, Mongoose, Passport-JWT, class-validator, bcryptjs
- Frontend: Next.js 15, React 19, Tailwind CSS
- DB: MongoDB (local) — database name: `e_commerce_app`

## Structure
```
./backend    # NestJS app (REST under /api)
./frontend   # Next.js app (App Router)
```

## Prerequisites
- Node.js 18+
- MongoDB running at mongodb://localhost:27017
- Ports free: 3000 (frontend), 3001 (backend)

## Configuration
Create `backend/.env` from example:
```
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/e_commerce_app

JWT_AT_SECRET=replace_with_strong_access_secret
JWT_AT_EXPIRES_IN=15m
JWT_RT_SECRET=replace_with_strong_refresh_secret
JWT_RT_EXPIRES_IN=7d
```
Optional (frontend): create `frontend/.env.local` to override API base:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Run locally
Backend:
```
cd backend
npm install
npm run start:dev
```
API base: http://localhost:3001/api

Frontend:
```
cd frontend
npm install
npm run dev
```
App: http://localhost:3000

## Auth flow
- Signup (`POST /api/auth/signup`) -> returns access/refresh tokens.
- Signin (`POST /api/auth/signin`) -> returns access/refresh tokens.
- Logout (`POST /api/auth/logout`) -> clears refresh token server-side.
- Refresh (`POST /api/auth/refresh`) -> rotates tokens.
- Roles: `user` (default), `admin`.
- Client-side protection: `AuthGate` component in `frontend/src/components/AuthGate.tsx` guards `/admin` and `/user` layouts.

## Routes
- Frontend:
  - `/login`, `/signup`
  - `/admin` (admin role)
  - `/user` (user role)
- Backend (prefix `/api`): `auth/*`, `users/*` (protected except `@Public()` ones)

## Development notes
- Backend CORS allows `FRONTEND_ORIGIN`.
- Global ValidationPipe and API prefix `/api` set in `backend/src/main.ts`.
- Default backend port is `3001` to avoid Next.js conflict.

## Security
- Passwords hashed with bcrypt.
- Refresh tokens hashed and stored per user.
- Use environment variables for secrets; do not commit `.env`.

## License
MIT (or your choice)
