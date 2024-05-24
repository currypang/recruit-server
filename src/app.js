import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from '../middlewares/error-handler.middleware.js';
import authRouter from './routers/auth.router.js';
import resumesRouter from './routers/resumes.router.js';
import usersRouter from './routers/users.router.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use('/', [usersRouter, resumesRouter, authRouter]);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
