import { MySqlContainer } from '@testcontainers/mysql';
import { RedisContainer } from '@testcontainers/redis';

export default async () => {
  const container = await new MySqlContainer('mysql:8.0')
    .withDatabase('app_test')
    .withUsername('test')
    .withUserPassword('test')
    .withRootPassword('root')
    .start();

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = String(container.getPort());
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'app_test';
  process.env.JWT_SECRET = 'e2e-secret';

  const redis = await new RedisContainer('redis:7').start();

  process.env.REDIS_HOST = redis.getHost();
  process.env.REDIS_PORT = String(redis.getPort());

  (globalThis as any).__REDIS__ = redis;
  (globalThis as any).__MYSQL__ = container;
};
