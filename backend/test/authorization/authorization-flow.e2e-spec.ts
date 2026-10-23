// (createRole, createPermission);
// (assignPermissionToRole, assignRoleToUser);
// getUserPermissions;
// (removePermissionToRole, removeUserRole);

import { AppModule } from '@/src/app.module';
import { setupApp } from '@/src/setup-app';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { clearDb, resetDatabase } from '../helpers/db';
import { DataSource, Repository } from 'typeorm';
import { SeedService } from '@/src/seed/seed.service';
import { loginAs } from '../helpers/auth';
import * as request from 'supertest';
import { User } from '@/src/user/entities/user.entity';

describe('Authorization flow - e2e', () => {
  let app: NestExpressApplication;
  let server: any;
  let adminToken: string;
  let normalToken: string;
  let superadminToken: string;
  let userRepo: Repository<User>;
  let dataSource: DataSource;
  const BASE_URL = '/api/v1/authorization';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    server = app.getHttpServer();
    dataSource = moduleRef.get(DataSource);
    userRepo = dataSource.getRepository(User);

    await resetDatabase(dataSource);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await clearDb(app.get(DataSource));
    await app.get(SeedService, { strict: false }).seedData();
    superadminToken = (await loginAs(app, 'superadmin@gmail.com')).accessToken;
    adminToken = (await loginAs(app, 'admin1@gmail.com')).accessToken;
    normalToken = (await loginAs(app, 'staff1@gmail.com')).accessToken;
  });

  const getUser = (email: string) => userRepo.findOneByOrFail({ email });

  async function createRole(name: string): Promise<string> {
    const res = await request(server)
      .post(`${BASE_URL}/roles`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ name })
      .expect(201);
    return (res.body.data ?? res.body).id;
  }

  async function createPermission(
    action: string,
    resource: string,
  ): Promise<string> {
    const res = await request(server)
      .post(`${BASE_URL}/permissions`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ action, resource })
      .expect(201);
    return (res.body.data ?? res.body).id;
  }

  async function getEffectivePermissions(
    userId: number,
    token: string,
  ): Promise<string[]> {
    const res = await request(server)
      .get(`${BASE_URL}/users/${userId}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const list = res.body.data ?? res.body;
    return list.map((p: any) => (typeof p === 'string' ? p : p.name));
  }

  describe('protect endpoint', () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    it.each([
      [
        'assignRoleToUser',
        () =>
          request(server)
            .patch(`${BASE_URL}/users/1/roles`)
            .send({ roleId: fakeId }),
      ],
      [
        'assignPermissionsToRole',
        () =>
          request(server)
            .patch(`${BASE_URL}/users/1/roles`)
            .send({ permissionIds: [fakeId] }),
      ],
    ])('%s: missing token -> 401', async (_name, call) => {
      await call().expect(401);
    });

    it.each([
      [
        'assignRoleToUser',
        () =>
          request(server)
            .patch(`${BASE_URL}/users/${fakeId}/roles`)
            .send({ roleId: fakeId }),
      ],
      [
        'assignPermissionsToRole',
        () =>
          request(server)
            .post(`${BASE_URL}/roles/${fakeId}/permissions`)
            .send({ permissionIds: [fakeId] }),
      ],
    ])('%s: missing permission -> 403', async (_name, call) => {
      await call().set('Authorization', `Bearer ${normalToken}`).expect(403);
    });
  });

  describe('prevent privilege escalation', () => {
    it('normal users cannot assign and change their role', async () => {
      const roleId = await createRole('e2e-escalation-role');
      const permId = await createPermission('read', 'e2e:escalation');
      const user = await getUser('staff1@gmail.com');

      const res = await request(server)
        .post(`${BASE_URL}/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ permissionId: permId })
        .expect((r) => expect(r.status).toBeLessThan(300));

      const before = await getEffectivePermissions(user?.id, superadminToken);

      await request(server)
        .patch(`${BASE_URL}/users/${user.id}/roles`)
        .set('Authorization', `Bearer ${normalToken}`)
        .send({ roleId })
        .expect(403);

      const after = await getEffectivePermissions(user?.id, superadminToken);
      expect(after).toEqual(before);
      expect(after).not.toContain('e2e:escalation');
    });

    it('normal users cannot assign permission for their role', async () => {
      const roleId = await createRole('e2e-escalation-role-2');
      const permId = await createPermission('read', 'e2e:escalation-2');

      await request(server)
        .post(`${BASE_URL}/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${normalToken}`)
        .send({ permissionIds: [permId] })
        .expect(403);
    });
  });

  describe('assign role for user flow (happy path)', () => {
    it('assgin permission for role -> assign role for user -> user have permission', async () => {
      const roleId = await createRole('e2e-flow-role');
      const permA = await createPermission('read', 'e2e');
      const permB = await createPermission('create', 'e2e');
      const user = await getUser('staff1@gmail.com');

      await request(server)
        .post(`${BASE_URL}/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ permissionId: permA })
        .expect((r) => expect(r.status).toBeLessThan(300));

      await request(server)
        .post(`${BASE_URL}/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ permissionId: permB })
        .expect((r) => expect(r.status).toBeLessThan(300));

      await request(server)
        .patch(`${BASE_URL}/users/${user.id}/roles`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ roleId })
        .expect((r) => expect(r.status).toBeLessThan(300));

      const after = await getEffectivePermissions(user.id, superadminToken);
      expect(after).toEqual(expect.arrayContaining([`e2e:read`, `e2e:create`]));
    });
  });
});
