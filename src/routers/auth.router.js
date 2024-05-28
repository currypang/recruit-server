import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
import { validateRefreshToken } from '../middlewares/require-refresh-token-middleware.js';
import { signInValidator } from '../middlewares/validators/sign-in.validator.middleware.js';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/env.constant.js';
import { AUTH_CONS } from '../constants/auth.constant.js';

const router = express.Router();
// 로그인 API, joi 미들웨어로 유효성 검사
router.get('/sign-in', signInValidator, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //이메일로 조회되지 않거나 비밀번호가 일치하지 앟는 경우
    const user = await prisma.users.findFirst({ where: { email } });
    const isValidUser = user && (await bcrypt.compare(password, user.password));
    if (!isValidUser) {
      return next('invalidSignIn');
    }
    // accessToken 생성
    const accessToken = jwt.sign({ userId: user.userId }, ACCESS_TOKEN_KEY, {
      expiresIn: AUTH_CONS.accessExpireTime,
    });
    // refreshToken 생성
    const refreshToken = jwt.sign({ userId: user.userId }, REFRESH_TOKEN_KEY, {
      expiresIn: AUTH_CONS.refreshExpireTime,
    });
    // 서버에 refreshToken 저장 / upsert 메서드로 리팩토링 - db에 데이트 있으면 업데이트, 없으면 생성
    await prisma.refreshTokens.upsert({
      where: { UserId: user.userId },
      update: { refreshToken },
      create: { UserId: user.userId, refreshToken },
    });

    return res.status(200).json({
      status: 200,
      message: '로그인에 성공했습니다.',
      accessToken: `Bearer ${accessToken}`,
      refreshToken: `Bearer ${refreshToken}`,
    });
  } catch (err) {
    next(err);
  }
});

// 토큰 재발급 API, refreshToken 인증 미들웨어 사용
router.post('/refresh', validateRefreshToken, async (req, res, next) => {
  try {
    const user = req.user;
    // 토큰 발급
    const accessToken = jwt.sign({ userId: user.userId }, ACCESS_TOKEN_KEY, {
      expiresIn: AUTH_CONS.accessExpireTime,
    });
    const refreshToken = jwt.sign({ userId: user.userId }, REFRESH_TOKEN_KEY, {
      expiresIn: AUTH_CONS.refreshExpireTime,
    });

    // 서버에 refreshToken 저장
    await prisma.refreshTokens.upsert({
      where: { UserId: user.userId },
      update: { refreshToken },
      create: { UserId: user.userId, refreshToken },
    });

    return res.status(200).json({
      status: 200,
      message: '토큰 재발급에 성공했습니다.',
      accessToken: `Bearer ${accessToken}`,
      refreshToken: `Bearer ${refreshToken}`,
    });
  } catch (err) {
    next(err);
  }
});

// 로그아웃 API, refreshToken 인증 미들웨어 사용
router.post('/sign-out', validateRefreshToken, async (req, res, next) => {
  try {
    const user = req.user;
    const deletedToken = await prisma.refreshTokens.delete({
      where: {
        UserId: user.userId,
      },
      select: {
        UserId: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: '로그아웃 되었습니다.',
      userId: deletedToken.UserId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
