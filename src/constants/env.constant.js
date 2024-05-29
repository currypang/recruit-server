import 'dotenv/config';

export const ENV_CONS = {
  SERVER_PORT: process.env.PORT,
  BCRYPT_ROUND: process.env.BCRYPT_SOLT_ROUND,
  ACCESS_TOKEN_KEY: process.env.JWT_ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY: process.env.JWT_REFRESH_TOKEN_KEY,
};
