import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { validateRefreshToken } from '../middlewares/require-refresh-token-middleware.js';

const router = express.Router();
// 로그인 API
router.get('/auth/sign-in', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // 입력정보가 하나라도 빠진 경우
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: 400, message: '정보를 모두 입력해 주세요' });
    }
    // 이메일 형식이 맞지 않음
    const val = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.test(email)) {
      return res
        .status(400)
        .json({ status: 400, message: '이메일 형식이 올바르지 않습니다.' });
    }
    //이메일로 조회되지 않거나 비밀번호가 일치하지 앟는 경우 / 이메일과 비밀번호 함께처리시 유저정보 없을시 password null에러 발생, 일단 분기하여 처리
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ status: 401, message: '인증 정보가 유효하지 않습니다.' });
    }
    // 비밀번호 다를 경우
    const passwordTest = await bcrypt.compare(password, user.password);
    if (!passwordTest) {
      return res
        .status(401)
        .json({ status: 401, message: '인증 정보가 유효하지 않습니다.' });
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
    // 만료시간 -> 모델에서 설정하는법 찾아보기
    // UNIX -> UTC 로 변환
    const expiredAt = new Date(jwt.decode(refreshToken).exp * 1000);
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
        expiredAt,
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
  // 만료시간 -> 모델에서 설정하는법 찾아보기
  // UNIX -> UTC 로 변환
  const expiredAt = new Date(jwt.decode(refreshToken).exp * 1000);
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
      expiredAt,
    },
  });

  return res.status(200).json({
    status: 200,
    message: '토큰 재발급에 성공했습니다.',
    accessToken: `Bearer ${accessToken}`,
    refreshToken: `Bearer ${refreshToken}`,
  });
});

export default router;
