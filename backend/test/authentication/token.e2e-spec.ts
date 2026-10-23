import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { clearDb, resetDatabase } from '../helpers/db';
import { loginAs } from '../helpers/auth';
import { setupApp } from '../../src/setup-app';
import { AppModule } from '../../src/app.module';
import { SeedModule } from '@/src/seed/seed.module';
import { SeedService } from '@/src/seed/seed.service';
import { NestExpressApplication } from '@nestjs/platform-express';

const URL = '/api/v1/authentication/tokens';
const ALLOWED_EMAIL = 'superadmin@gmail.com';

describe('GET /authentication/tokens (JWT guard + RBAC)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SeedModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    setupApp(app);
    await app.init();
    await resetDatabase(app.get(DataSource));
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await clearDb(app.get(DataSource));
    await app.get(SeedService, { strict: false }).seedData();
  });

  it('missing token → 401', async () => {
    const res = await request(app.getHttpServer()).get(URL);
    expect(res.status).toBe(401);
  });

  it('token invalid → 401', async () => {
    const res = await request(app.getHttpServer())
      .get(URL)
      .set('Authorization', 'Bearer token.invalid');
    expect(res.status).toBe(401);
  });

  it('valid permission → 200', async () => {
    const { accessToken } = await loginAs(app, ALLOWED_EMAIL);

    const res = await request(app.getHttpServer())
      .get(URL)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});
