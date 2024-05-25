import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { prisma } from '../utils/prisma.util.js';

export const validateAccessToken = async (req, res, next) => {
  try {
    // accessToken 받아오기
    const { authorization } = req.cookies;
    // 아래 두 분기 한번에 처리할 방법 찾기
    if (!authorization) {
      return res.status(401).json({ errorMessage: '인증정보가 없습니다.' });
    }
    const [tokenType, accessToken] = authorization.split(' ');
    if (!accessToken) {
      return res.status(401).json({ errorMessage: '인증정보가 없습니다.' });
    }
    //decodedToken = { "userId": 11, "iat": 1716534043, "exp": 1716577243}
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    if (tokenType !== 'Bearer' || !decodedToken) {
      return res
        .status(401)
        .json({ errorMessage: '지원하지 않는 인증방식입니다.' });
    }
    // 유효기간 검증은 연결 후 테스트 하며 추가
    // token에서 받아온 id로 유저 유무 검증
    const user = await prisma.users.findFirst({
      where: { userId: decodedToken.userId },
    });
    if (!user) {
      return res
        .status(401)
        .json({ errorMessage: '인증 정보와 일치하는 사용자가 없습니다.' });
    }
    // 인증 통과 시 유저 정보를 req.user에 담아 넘겨주기.
    req.user = user;
    return next();
  } catch (err) {
    // err.name / err.message로 접근해도 된다.
    if (err instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ errorMessage: '인증 정보가 만료되었습니다.' });
    }

    return res.status(401).json({
      error: err.message,
      errorMessage: '인증정보가 유효하지 않습니다.',
    });
  }
};
