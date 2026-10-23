import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { clearDb, resetDatabase } from '../helpers/db';
import { loginAs } from '../helpers/auth';
import { setupApp } from '@/src/setup-app';
import { AppModule } from '../../src/app.module';
import { SeedService } from '@/src/seed/seed.service';
import { NestExpressApplication } from '@nestjs/platform-express';

describe('POST /authorization/roles (createRole) - e2e', () => {
  let app: NestExpressApplication;
  let adminToken: string;
  let normalToken: string;
  let server: any;

  const url = '/api/v1/authorization/roles';
  const validBody = { name: 'e2e-editor', description: 'role created by e2e' };

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

  beforeEach(async () => {
    await clearDb(app.get(DataSource));
    await app.get(SeedService, { strict: false }).seedData();
    adminToken = (await loginAs(app, 'superadmin@gmail.com')).accessToken;
    normalToken = (await loginAs(app, 'staff1@gmail.com')).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('Protect endpoint (AuthJwtGuard + PermissionsGuard)', () => {
    it('missing token -> 401', async () => {
      await request(server).post(url).send(validBody).expect(401);
    });

    it('invalid token -> 401', async () => {
      await request(server)
        .post(url)
        .set('Authorization', 'Bearer invalid.token.value')
        .send(validBody)
        .expect(401);
    });

    it('valid token without authorization:create perrmission -> 403', async () => {
      await request(server)
        .post(url)
        .set('Authorization', `Bearer ${normalToken}`)
        .send(validBody)
        .expect(403);
    });
  });

  describe('validation DTO', () => {
    it('missing name -> 400', async () => {
      await request(server)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'no name' })
        .expect(400);
    });

    it('name invalid type -> 400 ', async () => {
      await request(server)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody, name: 123 })
        .expect(400);
    });
  });

  describe('business logic', () => {
    it('create role success -> 201', async () => {
      const res = await request(server)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBody)
        .expect(201);

      const role = res.body.data ?? res.body;
      expect(role).toMatchObject({ name: validBody.name });
      expect(role.id).toBeDefined();
    });

    it('create duplicate role -> 409', async () => {
      await request(server)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBody)
        .expect(201);

      await request(server)
        .post(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBody)
        .expect(409);
    });
  });
});
