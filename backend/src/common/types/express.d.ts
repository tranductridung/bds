import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';

declare module 'express' {
  interface Request {
    user?: UserPayload;
  }
}
