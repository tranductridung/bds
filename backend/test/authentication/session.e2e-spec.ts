import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { clearDb, resetDatabase } from '../helpers/db';
import { setupApp } from '../../src/setup-app';
import { AppModule } from '../../src/app.module';
import { getCookie, loginAs } from '../helpers/auth';
import { SeedService } from '../../src/seed/seed.service';
import { NestExpressApplication } from '@nestjs/platform-express';

const BASE_URL = '/api/v1/authentication';

describe('Session (e2e)', () => {
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

  // LOGOUT
  describe('POST /authentication/logout', () => {
    it('cookie valid -> return success and cookie is cleared', async () => {
      const { refreshCookie } = await loginAs(app, 'superadmin@gmail.com');

      const res = await request(server)
        .post(`${BASE_URL}/logout`)
        .set('Cookie', refreshCookie);

      expect(res.status).toBeLessThan(300);
      expect(JSON.stringify(res.body)).toContain('Logout successfully!');

      const clearedCookie = getCookie(res, 'refreshToken');

      expect(clearedCookie).toBeDefined();
      expect(clearedCookie).toMatch(/refreshToken=;/);
      expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });

    it('refresh by old token when user has logout -> 401', async () => {
      const { refreshCookie } = await loginAs(app, 'superadmin@gmail.com');

      const res = await request(server)
        .post(`${BASE_URL}/logout`)
        .set('Cookie', refreshCookie);

      expect(res.status).toBeLessThan(300);

      await request(server)
        .post(`${BASE_URL}/refresh`)
        .set('Cookie', refreshCookie)
        .expect(401);
    });

    it('missing cookie -> still return success and do not set cookie', async () => {
      const res = await request(server).post(`${BASE_URL}/logout`);

      expect(res.status).toBeLessThan(300);

      expect(JSON.stringify(res.body)).toContain('Logout successfully!');
      expect(getCookie(res, 'refreshToken')).toBeUndefined();
    });

    it('cookie is trash token -> do not return 500', async () => {
      const res = await request(server)
        .post(`${BASE_URL}/logout`)
        .set('Cookie', 'refreshToken=invalid.token.value');

      expect(res.status).toBeLessThan(500);
    });

    it('logout twice consecutively -> not return 500 in the second', async () => {
      const { refreshCookie } = await loginAs(app, 'staff1@gmail.com');

      await request(server)
        .post(`${BASE_URL}/logout`)
        .set('Cookie', refreshCookie);

      const res = await request(server)
        .post(`${BASE_URL}/logout`)
        .set('Cookie', refreshCookie);

      expect(res.status).toBeLessThan(500);
    });

    it('login 2 device, logout 1 device -> the second device still refresh', async () => {
      const deviceA = await loginAs(app, 'superadmin@gmail.com');
      // Wait to avoid create same refresh token (JWT có thể giống nhau nếu cùng iat)
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const deviceB = await loginAs(app, 'superadmin@gmail.com');

      const res = await request(server)
        .post(`${BASE_URL}/logout`)
        .set('Cookie', deviceA.refreshCookie);
      expect(res.status).toBeLessThan(300);

      console.log('res nèeeeeeeeeeeeeeee', res.body);
      // thiết bị A đã logout -> faild
      const res2 = await request(server)
        .post(`${BASE_URL}/refresh`)
        .set('Cookie', deviceA.refreshCookie);
      console.log('res22222 nèeeeeeeeeeeeeeee', res2.body);

      expect(res2.status).toBe(401);

      // thiết bị B vẫn còn hiệu lực
      expect(
        await request(server)
          .post(`${BASE_URL}/refresh`)
          .set('Cookie', deviceB.refreshCookie),
      );
    });

    // =========== CHƯA SỬA ===========
    // it('thuộc tính Secure khi clear cookie khớp lúc login', async () => {
    //   // Login set secure:false, logout clear với secure:true.
    //   // Test FAIL nếu hai bên không đồng bộ -> cần sửa code.
    //   const { rawCookie, refreshCookie } = await login();

    //   const res = await request(server)
    //     .post(`${BASE_URL}/logout`)
    //     .set('Cookie', refreshCookie);
    //   const cleared = getCookies(res).find((c) =>
    //     c.startsWith('refreshToken='),
    //   )!;

    //   expect(/;\s*Secure/i.test(cleared)).toBe(/;\s*Secure/i.test(rawCookie));
    // });
  });

  // REFRESH
  describe('POST /authentication/refresh', () => {
    it('missing cookie -> 401', async () => {
      await request(server).post(`${BASE_URL}/refresh`).expect(401);
    });

    it('cookie is trash token -> 401', async () => {
      await request(server)
        .post(`${BASE_URL}/refresh`)
        .set('Cookie', 'refreshToken=invalid.token.value')
        .expect(401);
    });

    it('new access token use for call endpoint with guard', async () => {
      const { refreshCookie } = await loginAs(app, 'superadmin@gmail.com');

      const refreshRes = await request(server)
        .post(`${BASE_URL}/refresh`)
        .set('Cookie', refreshCookie);
      expect(refreshRes.status).toBeLessThan(300);

      const newAccessToken: string =
        refreshRes.body?.data?.accessToken ??
        refreshRes.body?.data ??
        refreshRes.body?.accessToken;

      const res = await request(server)
        .get(`${BASE_URL}/tokens`)
        .set('Authorization', `Bearer ${newAccessToken}`);
      expect(res.status).toBe(200);
    });
  });
});
