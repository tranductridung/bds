import * as request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';

export const API = '/api/v1';

const PASSWORDS: Record<string, string> = {
  'superadmin@gmail.com': 'superadmin',
  'admin1@gmail.com': 'admin',
  'admin2@gmail.com': 'admin',
  'staff1@gmail.com': 'staff',
  'staff2@gmail.com': 'staff',
  'unverifiedStaff1@gmail.com': 'staff',
  'unverifiedStaff2@gmail.com': 'staff',
};
export async function loginAs(app: NestExpressApplication, email: string) {
  const password = PASSWORDS[email];
  if (!password) throw new Error(`Password for ${email} is not defined`);

  const res = await request(app.getHttpServer())
    .post(`${API}/authentication/login`)
    .send({ email, password });

  if (res.status >= 300) {
    throw new Error(
      `Login failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }

  const rawCookie = getCookie(res, 'refreshToken');
  if (!rawCookie) {
    throw new Error('Login response did not set refreshToken cookie');
  }

  return {
    accessToken: res.body?.data?.accessToken as string,
    rawCookie,
    refreshCookie: rawCookie.split(';')[0],
  };
}

export const getCookies = (res: request.Response): string[] =>
  (res.headers['set-cookie'] as unknown as string[]) ?? [];

export const getCookie = (
  res: request.Response,
  name: string,
): string | undefined => getCookies(res).find((c) => c.startsWith(`${name}=`));

export function signAccessToken(
  payload: Record<string, unknown>,
  expiresAt: Date,
) {
  return new JwtService().sign(
    { ...payload, exp: Math.floor(expiresAt.getTime() / 1000) },
    { secret: process.env.ACCESS_TOKEN },
  );
}

export function signSetupPwdToken(
  payload: Record<string, unknown>,
  expiresAt: Date,
) {
  return new JwtService().sign(
    { ...payload, exp: Math.floor(expiresAt.getTime() / 1000) },
    { secret: process.env.SETUP_PASSWORD_TOKEN },
  );
}
