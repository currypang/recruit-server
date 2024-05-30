import express from 'express';
import { validateAccessToken } from '../middlewares/require-acess-token.middleware.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js';

const userRouter = express.Router();

// 내 정보 조회 API, acessToken 인증 미들웨어 사용
userRouter.get('/me', validateAccessToken, async (req, res, next) => {
  try {
    // validateAccessToken 에서 password 제외 후 유저정보 전달하게 리팩토링. 아래 코드 필요 없음.
    // const { password, ...withoutPassword } = req.user;
    const data = req.user;
    return res.status(HTTP_STATUS.OK).json({ status: HTTP_STATUS.OK, message: MESSAGES.USERS.READ_ME.SUCCEED, data });
  } catch (err) {
    next(err);
  }
});

// export 방법 바꿔보기
export { userRouter };
