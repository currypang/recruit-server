import express from 'express';
import router from './routers/index.js';
import { ENV_CONS } from './constants/env.constant.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);
app.use(errorHandler);

app.listen(ENV_CONS.SERVER_PORT, () => {
  console.log(ENV_CONS.SERVER_PORT, '포트로 서버가 열렸어요!');
});
