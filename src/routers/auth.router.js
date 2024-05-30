import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
import { validateRefreshToken } from '../middlewares/require-refresh-token-middleware.js';
import { signUpValidator } from '../middlewares/validators/sign-up.validator.middleware.js';
import { signInValidator } from '../middlewares/validators/sign-in.validator.middleware.js';
import { ENV_CONS } from '../constants/env.constant.js';
import { AUTH_CONS } from '../constants/auth.constant.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js';

const authRouter = express.Router();

// 회원가입 API, joi 미들웨어로 유효성 검사, 에러 미들웨어로 에러처리
authRouter.post('/sign-up', signUpValidator, async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const existUser = await prisma.user.findUnique({ where: { email } });

    // 이메일 중복시 처리, return 없이도 정상 작동하지만 사용해서 prisma 에러 로그 방지
    if (existUser) {
      return next('existUser');
    }
    // dotenv 환경변수는 문자열로 반환되니 salt를 숫자형으로 변환한다.
    const hashedPassword = await bcrypt.hash(password, +ENV_CONS.BCRYPT_ROUND); //동기방식으로 await 제외 bcrypt.hashSync도 가능
    // DB에 회원정보 생성
    let user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      omit: {
        password: true,
      },
      // select: {
      //   id: true,
      //   email: true,
      //   name: true,
      //   role: true,
      //   createdAt: true,
      //   updatedAt: true,
      // },
    });
    // select로 선택대신 아래 방식가능
    user.password = undefined;
    return res
      .status(HTTP_STATUS.CREATED)
      .json({ status: HTTP_STATUS.CREATED, message: MESSAGES.AUTH.SIGN_UP.SUCCEED, data: user });
  } catch (err) {
    next(err);
  }
});
// 로그인 API, joi 미들웨어로 유효성 검사
authRouter.post('/sign-in', signInValidator, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //이메일로 조회되지 않거나 비밀번호가 일치하지 앟는 경우, 스키마의 모델 User -> 소문자로 불러옴
    const user = await prisma.user.findUnique({ where: { email } });
    // 동기함수인 compareSync도 사용가능
    const isValidUser = user && (await bcrypt.compare(password, user.password));
    if (!isValidUser) {
      return next('invalidSignIn');
    }
    // accessToken 생성
    const accessToken = jwt.sign({ id: user.id }, ENV_CONS.ACCESS_TOKEN_KEY, {
      expiresIn: AUTH_CONS.ACCESS_EXPIRE_TIME,
    });

    // refreshToken 생성
    const refreshToken = jwt.sign({ id: user.id }, ENV_CONS.REFRESH_TOKEN_KEY, {
      expiresIn: AUTH_CONS.REFRESH_EXPIRE_TIME,
    });

    // 리프레쉬 토큰 해쉬한번 더하기, soltround는 숫자여야함
    const hashedRefreshToken = bcrypt.hashSync(refreshToken, ENV_CONS.BCRYPT_ROUND);

    // // 서버에 해쉬된 refreshToken 저장 / upsert 메서드로 리팩토링 - db에 데이트 있으면 업데이트, 없으면 생성
    await prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: { refreshToken: hashedRefreshToken },
      create: { userId: user.id, refreshToken: hashedRefreshToken },
    });
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.SIGN_IN.SUCCEED,
      data: { accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
});

// 토큰 재발급 API, refreshToken 인증 미들웨어 사용
authRouter.post('/refresh', validateRefreshToken, async (req, res, next) => {
  try {
    const user = req.user;
    const payload = { id: user.id };
    // 토큰 발급
    const data = await generateAuthTokens(payload);

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.TOKEN.SUCCEED,
      data,
    });
  } catch (err) {
    next(err);
  }
});

// 로그아웃 API, refreshToken 인증 미들웨어 사용
authRouter.post('/sign-out', validateRefreshToken, async (req, res, next) => {
  try {
    const user = req.user;
    await prisma.refreshToken.update({
      where: { userId: user.id },
      data: {
        refreshToken: null,
      },
    });

    //아래처럼 삭제해도 됨
    // const deletedToken = await prisma.refreshToken.delete({
    //   where: {
    //     userId: user.id,
    //   },
    //   select: {
    //     userId: true,
    //   },
    // });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.SIGN_OUT.SUCCEED,
      data: { id: user.id },
    });
  } catch (err) {
    next(err);
  }
});

const generateAuthTokens = async (payload) => {
  const userId = payload.id;
  const accessToken = jwt.sign(payload, ENV_CONS.ACCESS_TOKEN_KEY, {
    expiresIn: AUTH_CONS.ACCESS_EXPIRE_TIME,
  });
  const refreshToken = jwt.sign(payload, ENV_CONS.REFRESH_TOKEN_KEY, {
    expiresIn: AUTH_CONS.REFRESH_EXPIRE_TIME,
  });
  // 리프레쉬 토큰 해쉬한번 더하기, soltround는 숫자여야함
  const hashedRefreshToken = bcrypt.hashSync(refreshToken, ENV_CONS.BCRYPT_ROUND);

  // 서버에 refreshToken 저장
  await prisma.refreshToken.upsert({
    where: { userId },
    update: { refreshToken: hashedRefreshToken },
    create: { userId, refreshToken: hashedRefreshToken },
  });
  return { accessToken, refreshToken };
};

// export 방법 바꿔 보기
export { authRouter };
