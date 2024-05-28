import 'dotenv/config';

export const SERVER_PORT = process.env.PORT;
export const BCRYPT_ROUND = process.env.BCRYPT_SOLT_ROUND;
export const ACCESS_TOKEN_KEY = process.env.JWT_ACCESS_TOKEN_KEY;
export const REFRESH_TOKEN_KEY = process.env.JWT_REFRESH_TOKEN_KEY;
