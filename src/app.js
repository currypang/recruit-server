import express from 'express';
import router from './routers/index.js';
import { SERVER_PORT } from './constants/env.constant.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

const app = express();

app.use(express.json());

app.use('/', router);
app.use(errorHandler);

app.listen(SERVER_PORT, () => {
  console.log(SERVER_PORT, '포트로 서버가 열렸어요!');
});
