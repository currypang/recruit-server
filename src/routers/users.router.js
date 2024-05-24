import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { validateAccessToken } from '../middlewares/require-acess-token.middleware.js';

const router = express.Router();

// 유효성 검사는 후에 joi로 리팩토링 할 것
// 회원가입 API
router.post('/users/sign-up', async (req, res, next) => {
  try {
    const { email, name, password, passwordConfirm } = req.body;
    const existUser = await prisma.users.findFirst({ where: { email } });
    // 회원 정보 중 하나라도 빠진 경우
    if (!email || !name || !password || !passwordConfirm) {
      return res.status(400).json('정보를 모두 입력해 주세요');
    }
    // 이메일 중복
    if (existUser) {
      return res.status(400).json('이미 가입 된 사용자입니다');
    }
    // 이메일 형식이 맞지 않음
    const val = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.test(email)) {
      return res.status(400).json('이메일 형식이 올바르지 않습니다.');
    }
    // 비밀번호가 6자리 미만인 경우
    if (password.length < 6) {
      return res.status(400).json('비밀번호는 6자리 이상이어야 합니다.');
    }
    // 비밀번호와 비밀번호 확인이 일치하지 않는 경우
    if (password !== passwordConfirm) {
      return res.status(401).json('입력한 두 비밀번호가 일치하지 않습니다.');
    }
    // dotenv 환경변수는 문자열로 반환, salt를 숫자형으로 변환한다.
    // 해싱
    const hashedPassword = await bcrypt.hash(
      password,
      +process.env.BCRYPT_SOLT_ROUND,
    );
    let user = await prisma.users.create({
      data: {
        email,
        name,
        role: 'APPLICANT',
        password: hashedPassword,
      },
    });
    // 패스워드 제외한 유저정보 전달
    delete user.password;
    console.log(user);
    return res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
});

// 내 정보 조회 API
router.get('/users', validateAccessToken, async (req, res, next) => {
  try {
    // 패스워드 제외 스키마 설정으로 처리하게 알아보기
    delete req.user.password;
    return res
      .status(200)
      .json({ data: req.user, message: '내 정보 조회가 성공했습니다.' });
  } catch (err) {
    next(err);
  }
});

export default router;
