# BDS Backend

A NestJS-based backend API for the real estate project. This repository powers user management, authentication, authorization, notifications, reminders, property management, lead handling, and logging.

## Key Features

- Authentication and authorization with JWT and role-based control
- User, team, lead, feature, property, and rating management
- Scheduled reminders and cron jobs
- Email support via Nodemailer
- Cloudinary integration for image handling
- Redis-based rate limiting and BullMQ background queue support
- MySQL persistence via TypeORM
- Event-driven domain actions with NestJS EventEmitter
- Audit and system logging

## Technology Stack

- Node.js
- TypeScript
- NestJS
- MySQL / TypeORM
- Redis
- BullMQ
- Cloudinary
- Jest for testing
- ESLint + Prettier for code quality

## Repository Layout

- `backend/` - main NestJS application
  - `src/` - application source code
  - `test/` - end-to-end tests
  - `package.json` - npm scripts and dependencies
  - `tsconfig.json` / `tsconfig.build.json` - TypeScript configuration

## Project Status

- This is a personal project and is currently a work in progress.
- The backend is not deployed to a production environment.
- The code is prepared for cloud deployment or containerization if needed.
- Improvements are ongoing, especially around feature completion, stability, and production readiness.

## Getting Started 

### Prerequisites

- Node.js 20+ or compatible version
- npm
- MySQL server
- Redis server
- Optional: Cloudinary account for image uploads

### Install dependencies

Open a terminal in `backend/` and run:

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in `backend/` with the values needed for your environment. Common variables include:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB=your_database
JWT_SECRET=your_jwt_secret
REDIS_HOST=localhost
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email
MAIL_PASSWORD=your_password
```

> Note: The app currently configures TypeORM and BullMQ using environment variables and defaults for local Redis connection.

## Run the Application

From the `backend/` directory:

```bash
npm run start:dev
```

Available scripts:

- `npm run start` - start the server
- `npm run start:dev` - start in watch mode
- `npm run start:debug` - start with debugger enabled
- `npm run start:prod` - start production build from `dist`

## Build

```bash
npm run build
```

## Testing

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Code Quality

```bash
npm run lint
npm run format
```

## Seed Data

Seed scripts are available under `backend/src/seed`. Run:

```bash
npm run seed
```

## Notes

- `AppModule` registers several domain modules including authentication, authorization, users, teams, leads, properties, reminders, notifications, and logging.
- The application uses `synchronize: true` in TypeORM for development convenience. For production, review and disable automatic schema sync.
- The backend is designed to be extended with frontend or mobile clients via HTTP APIs.

## License

This project is currently marked as private/unlicensed in `backend/package.json`.
