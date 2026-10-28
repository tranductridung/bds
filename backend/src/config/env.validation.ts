import * as Joi from 'joi';

const secret = Joi.string().min(32).required(); // secret for JWT token
const duration = Joi.string().required(); // ex: '15m', '7d', '900'

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  // ---- MySQL ----
  MYSQL_HOST: Joi.string().required(),
  MYSQL_PORT: Joi.number().default(3306),
  MYSQL_DATABASE: Joi.string().required(),
  MYSQL_USERNAME: Joi.string().required(),
  MYSQL_USER: Joi.string().optional(),
  MYSQL_ROOT_PASSWORD: Joi.string().allow('').required(),

  // ---- Token ----
  ACCESS_TOKEN: secret,
  ACCESS_TOKEN_EXPIRES: duration,
  REFRESH_TOKEN: secret,
  REFRESH_TOKEN_EXPIRES: duration,
  VERIFY_EMAIL_TOKEN: secret,
  VERIFY_EMAIL_TOKEN_EXPIRES: duration,
  SETUP_PASSWORD_TOKEN: secret,
  SETUP_PASSWORD_TOKEN_EXPIRES: duration,

  // ---- Security / cookie ----
  SALT: Joi.number().integer().min(10).max(14).default(10),
  MAX_AGE: Joi.number().integer().positive().required(),
  MAX_TOKEN: Joi.number().integer().min(1).default(5),

  // ---- Superadmin (for seed) ----
  SUPERADMIN_EMAIL: Joi.string().email().required(),
  SUPERADMIN_PASSWORD: Joi.string().min(8).required(),

  // ---- Email ----
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASSWORD: Joi.string().required(),

  // ---- Cloudinary ----
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  // ---- Redis ----
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().default(6379),

  // ---- Queue / Rate limit ----
  QUEUE_WINDOW_MS: Joi.number().positive().default(60000),
  TRUST_PROXY_HOPS: Joi.number().positive().default(0),
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  REQUEST_LIMIT_DEFAULT: Joi.number().integer().positive().default(100),
  RATE_LIMIT_TTL_DEFAULT: Joi.number().positive().default(60),
});
