import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { validateRefreshToken } from '../middlewares/require-refresh-token-middleware.js';
import { signInValidator } from '../middlewares/validators/sign-in.validator.middleware.js';

const router = express.Router();
// 로그인 API
router.get('/auth/sign-in', signInValidator, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //이메일로 조회되지 않거나 비밀번호가 일치하지 앟는 경우
    // 이메일과 비밀번호 함께처리시 유저정보 없을시 password null에러 발생, 일단 분기하여 처리 -> 논리연산자 사용해 리팩토링
    const user = await prisma.users.findFirst({ where: { email } });
    const isValidUser = user && (await bcrypt.compare(password, user.password));

    if (!isValidUser) {
      return next('invalidSignIn');
    }
    // accessToken 생성
    const accessToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_ACCESS_TOKEN_KEY,
      { expiresIn: '12h' },
    );
    // refreshToken 생성
    const refreshToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_REFRESH_TOKEN_KEY,
      { expiresIn: '7d' },
    );

    // 서버에 refreshToken 저장
    const existRefreshToken = await prisma.refreshTokens.findFirst({
      where: { UserId: user.userId },
    });
    // 존재하면 삭제 뒤 생성 => 업데이트로 처리할지 고민할것
    if (existRefreshToken) {
      await prisma.refreshTokens.delete({ where: { UserId: user.userId } });
    }
    await prisma.refreshTokens.create({
      data: {
        UserId: user.userId,
        refreshToken,
      },
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

// 토큰 재발급 API
router.post('/auth/refresh', validateRefreshToken, async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    const user = req.user;

    const accessToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_ACCESS_TOKEN_KEY,
      { expiresIn: '12h' },
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_REFRESH_TOKEN_KEY,
      { expiresIn: '7d' },
    );
    // 서버에 refreshToken 저장
    // 존재하면 삭제 뒤 생성 => 업데이트로 처리할지 고민할것
    if (existRefreshToken) {
      await prisma.refreshTokens.delete({ where: { UserId: user.userId } });
    }
    await prisma.refreshTokens.create({
      data: {
        UserId: user.userId,
        refreshToken,
      },
    });

    return res.status(200).json({
      status: 200,
      message: '토큰 재발급에 성공했습니다.',
      accessToken: `Bearer ${accessToken}`,
      refreshToken: `Bearer ${refreshToken}`,
    });
  } catch (err) {
    nexx(err);
  }
});

// 로그아웃 API
router.post('/auth/sign-out', validateRefreshToken, async (req, res, next) => {
  try {
    // 1:N관계로 유저가 토큰 여러개 보유 시 authorization 사용가능. 지금은 필요없음
    // const { authorization } = req.headers;
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
