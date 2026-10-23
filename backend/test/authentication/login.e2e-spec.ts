import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { setupApp } from '../../src/setup-app';
import { AppModule } from '../../src/app.module';
import { clearDb, resetDatabase } from '../helpers/db';
import { SeedService } from '../../src/seed/seed.service';
import { NestExpressApplication } from '@nestjs/platform-express';

const URL = '/api/v1/authentication/login';
const EMAIL = 'superadmin@gmail.com';
const PASSWORD = 'superadmin';

describe('Login (e2e)', () => {
  let app: NestExpressApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    server = app.getHttpServer();
    await resetDatabase(app.get(DataSource));
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await clearDb(app.get(DataSource));
    await app.get(SeedService, { strict: false }).seedData();
  });

  describe('POST /login', () => {
    it('valid infor → get accessToken', async () => {
      const res = await request(server)
        .post(URL)
        .send({ email: EMAIL, password: PASSWORD });

      expect(res.status).toBeLessThan(300);
      expect(JSON.stringify(res.body)).toContain('accessToken');
    });

    it('wrong password -> 401', async () => {
      const res = await request(server)
        .post(URL)
        .send({ email: EMAIL, password: 'wrongPassword' });

      expect(res.status).toBe(401);
    });

    it('email not exist → 401', async () => {
      const res = await request(server)
        .post(URL)
        .send({ email: 'khongco@gmail.com', password: PASSWORD });

      expect(res.status).toBe(401);
    });

    it('password missing → 400', async () => {
      const res = await request(server).post(URL).send({ email: EMAIL });

      expect(res.status).toBe(400);
    });
  });
});
