import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { requireRoles } from '../middlewares/require-roles.middleware.js';

const router = express.Router();

router.get('/auth/sign-in', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // 입력정보가 하나라도 빠진 경우
    if (!email || !password) {
      return res.status(400).json('정보를 모두 입력해 주세요');
    }
    // 이메일 형식이 맞지 않음
    const val = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.test(email)) {
      return res.status(400).json('이메일 형식이 올바르지 않습니다.');
    }
    //이메일로 조회되지 않거나 비밀번호가 일치하지 앟는 경우 / 이메일과 비밀번호 함께처리시 유저정보 없을시 password null에러 발생, 일단 분기하여 처리
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ errorMessage: '인증 정보가 유효하지 않습니다-메일' });
    }
    // 비밀번호 다를 경우
    const passwordTest = await bcrypt.compare(password, user.password);
    if (!passwordTest) {
      return res
        .status(401)
        .json({ errorMessage: '인증 정보가 유효하지 않습니다-비번' });
    }
    // accessToken 부여
    const token = jwt.sign(
      {
        userId: user.userId,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '12h',
      },
    );
    res.cookie('authorization', `Bearer ${token}`);
    return res
      .status(200)
      .json({ data: token, message: '로그인에 성공했습니다.' });
  } catch (err) {
    next(err);
  }
});

export default router;
