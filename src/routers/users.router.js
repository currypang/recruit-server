import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import { validateAccessToken } from '../middlewares/require-acess-token.middleware.js';
import { signUpValidator } from '../middlewares/validators/sign-up.validator.middleware.js';

const router = express.Router();

// 회원가입 API, joi 미들웨어로 유효성 검사, 에러 미들웨어로 에러처리
router.post('/users/sign-up', signUpValidator, async (req, res, next) => {
  try {
    const { email, name, password, passwordConfirm } = req.body;
    const existUser = await prisma.users.findFirst({ where: { email } });

    // 이메일 중복시 처리, return 없이도 정상 작동하지만 사용해서 prisma 에러 로그 방지
    if (existUser) {
      return next('existUser');
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
        password: hashedPassword,
      },
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res
      .status(201)
      .json({ status: 201, message: '회원가입에 성공했습니다.', data: user });
  } catch (err) {
    next(err);
  }
});

// 내 정보 조회 API
router.get('/users', validateAccessToken, async (req, res, next) => {
  try {
    // 패스워드 제외 스키마 설정으로 처리하게 알아보기
    delete req.user.password;
    return res.status(200).json({
      status: 200,
      message: '내 정보 조회가 성공했습니다.',
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
