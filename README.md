# FirstHome Backend

A NestJS-based backend for the BDS platform. Provides authentication, authorization,
notifications, property and lead management, file uploads (Cloudinary), Redis-backed
rate limiting and caching, cron jobs, email sending, and database seeding utilities.

## Features

- Authentication (JWT, refresh tokens)
- Authorization (role/permission guards)
- Notifications & event listeners
- Property, Lead, Feature modules with DTOs and entities
- Cloudinary integration for image uploads
- Redis for caching and rate-limiting
- Cron jobs for reminders and token cleanup
- Mail service for outgoing emails
- DB seeding scripts for initial data (permissions, roles, etc.)

## Tech Stack

- Node.js, TypeScript
- NestJS
- PostgreSQL / TypeORM (or your chosen ORM)
- Redis
- Cloudinary
- Docker & docker-compose

## Prerequisites

- Node.js 18+ (recommended)
- npm or yarn
- Docker & docker-compose (for containerized run)
- A running PostgreSQL and Redis instance (or use docker-compose)

## Getting Started

1. Install dependencies

```bash
cd backend
npm install
# or `yarn`
```

2. Copy and configure environment variables

Create a `.env` in `backend/` (or set env vars in your environment). Typical keys:

- `DATABASE_URL` — database connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — JWT signing secret
- `JWT_REFRESH_SECRET` — refresh token secret
- `CLOUDINARY_URL` — Cloudinary config URL
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` — mailer settings

3. Run migrations / seed (if applicable)

```bash
# build & run seed script (project may expose a seed npm script)
npm run build
npm run seed
```

4. Start in development

```bash
npm run start:dev
```

Or run with Docker Compose from the repository root:

```bash
docker-compose up --build
```

## Scripts (common)

- `npm run start` — start production build
- `npm run start:dev` — start in development with hot-reload
- `npm run build` — compile TypeScript
- `npm run test` — run tests
- `npm run lint` — run linter
- `npm run seed` — run DB seed scripts (if available)

Check `backend/package.json` for exact script names.

## Environment Notes

- Keep secrets out of version control. Use `.env` (not committed) or a secret manager.
- When deploying, ensure `NODE_ENV=production` and that secrets are provided securely.

## Development Notes

- Code lives in `backend/src/` and is organized by feature/module.
- Tests are under `test/` and `backend/src/*.spec.ts` for unit tests.
- Use the existing DTOs, guards and interceptors when adding new endpoints.

## Seeding

The repository contains seed scripts under `backend/src/seed/` to populate initial
permissions and other base data. Run the seed script after connecting to the database.

## Contributing

- Fork the repo and create a feature branch.
- Run tests and linters before opening a PR.
- Include clear descriptions and related issue references in PRs.

## Troubleshooting

- If migrations fail, verify `DATABASE_URL` and that the DB user has permissions.
- For Cloudinary issues, confirm `CLOUDINARY_URL` environment variable is valid.

## License

This project is provided as-is. Add a `LICENSE` file to declare an open-source license.

## Contact

For questions, open an issue in this repository or contact the maintainers.
