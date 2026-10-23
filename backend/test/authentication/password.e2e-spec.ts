import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { clearDb, resetDatabase } from '../helpers/db';
import { setupApp } from '../../src/setup-app';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { signSetupPwdToken } from '../helpers/auth';
import { User } from '@/src/user/entities/user.entity';
import { UserStatus } from '@/src/user/enums/user.enum';
import { SeedService } from '../../src/seed/seed.service';
import { NestExpressApplication } from '@nestjs/platform-express';

const BASE_URL = '/api/v1/authentication';

describe('Password (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let server: any;

  const VALID_PASSWORD = 'Str0ngP@ssw0rd!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    dataSource = moduleRef.get(DataSource);
    userRepo = dataSource.getRepository(User);

    setupApp(app);
    await app.init();
    server = app.getHttpServer();
    await resetDatabase(dataSource);
    app.useLogger(['error']);
  });

  afterAll(async () => {
    await app?.close();
  });
  beforeEach(async () => {
    await clearDb(app.get(DataSource));
    await app.get(SeedService, { strict: false }).seedData();
  });

  const getUser = (email: string) => userRepo.findOneByOrFail({ email });

  const findUserWithPassword = async (id: number) =>
    await userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOneOrFail();

  describe('success', () => {
    it('activate account and save hashed password', async () => {
      const user = await getUser('unverifiedStaff1@gmail.com');
      await request(server)
        .post(`${BASE_URL}/setup-password`)
        .query({
          token: signSetupPwdToken(
            {
              sub: user.id,
            },
            new Date(Date.now() + 15 * 60 * 1000),
          ),
        })
        .send({ password: VALID_PASSWORD })
        .expect(201);

      const updated = await findUserWithPassword(user.id);
      expect(updated.status).toBe(UserStatus.ACTIVE);
      expect(updated.password).toBeTruthy();
      expect(updated.password).not.toBe(VALID_PASSWORD);
    });
  });

  describe('authentication (guard)', () => {
    it('missing setup pwd token -> 401', async () => {
      await request(server)
        .post(`${BASE_URL}/setup-password`)
        .send({ password: VALID_PASSWORD })
        .expect(401);
    });

    it('invalid token -> 401', async () => {
      await request(server)
        .post(`${BASE_URL}/setup-password`)
        .query({
          token: 'invalid-token',
        })
        .send({ password: VALID_PASSWORD })
        .expect(401);
    });

    it('token expired -> 401', async () => {
      const user = await getUser('unverifiedStaff1@gmail.com');

      await request(server)
        .post(`${BASE_URL}/setup-password`)
        .query({
          token: signSetupPwdToken(
            {
              sub: user.id,
            },
            new Date(Date.now() - 15 * 60 * 1000),
          ),
        })
        .send({ password: VALID_PASSWORD })
        .expect(401);

      const unchanged = await userRepo.findOneByOrFail({ id: user.id });
      expect(unchanged.status).toBe(UserStatus.UNVERIFIED);
    });
  });

  describe('logic error', () => {
    it.each([
      ['ACTIVE', UserStatus.ACTIVE],
      ['BANNED', UserStatus.BANNED],
      ['LOCKED', UserStatus.LOCKED],
    ])('account status is %s -> 400', async () => {
      const user = await getUser('staff1@gmail.com');
      const res = await request(server)
        .post(`${BASE_URL}/setup-password`)
        .query({
          token: signSetupPwdToken(
            {
              sub: user.id,
            },
            new Date(Date.now() + 15 * 60 * 1000),
          ),
        })
        .send({ password: VALID_PASSWORD })
        .expect(400);

      expect(JSON.stringify(res.body)).toContain(
        'Account is already activated!',
      );
    });
  });
});
