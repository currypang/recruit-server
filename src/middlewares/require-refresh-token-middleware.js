import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
import { ENV_CONS } from '../constants/env.constant.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js';
import bcrypt from 'bcrypt';

// refreshToken 인증 미들웨어
export const validateRefreshToken = async (req, res, next) => {
  try {
    // refreshToken 받아오기
    const { authorization } = req.headers;
    // authorization 없는 경우
    if (!authorization) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN });
    }
    const [tokenType, refreshToken] = authorization.split(' ');
    // JWT 표준 인증 형태와 일치하지 않는 경우
    if (tokenType !== 'Bearer') {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.JWT.NOT_SUPPORTED_TYPE });
    }
    // refreshToken이 없는경우
    if (!refreshToken) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN });
    }
    //decodedToken = { "id": 11, "iat": 1716534043, "exp": 1716577243}
    let decodedToken;
    //jwt.verify 함수를 통해 자체적으로 에러처리가 가능해서 따로 try, catch문 사용
    try {
      decodedToken = jwt.verify(refreshToken, ENV_CONS.REFRESH_TOKEN_KEY);
    } catch (err) {
      // refreshToken 유효기간이 지난경우
      // npm JWT 에러 문서의 TokenExpiredError 사용함. if (err instanceof jwt.TokenExpiredError)도 사용가능,
      if (err.name === 'TokenExpiredError') {
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.JWT.EXPIRED });
      }
      // 나머지 두 JsonWebTokenError, NotBeforeError 의 경우.
      else {
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.JWT.INVALID });
        // if, else 문으로 jwt.verify의 모든 에러의 경우를 처리해 이곳의 try, catch문은 next(err)불필요.
      }
    }
    //DB에서 refreshToken 을 조회
    const exitedRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        userId: decodedToken.id,
      },
    });
    //넘겨받은 refreshToken과 비교(optional chaining 사용)
    const isValidRefreshToken =
      exitedRefreshToken &&
      exitedRefreshToken?.refreshToken &&
      bcrypt.compareSync(refreshToken, exitedRefreshToken.refreshToken);

    if (!isValidRefreshToken) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.JWT.DISCARDED_TOKEN });
    }

    // token에서 받아온 id로 유저 유무 검증 - findUnique 사용
    // 패스워드 제외하고 조회, 필드를 추가하는 select는 있지만 제외하는 메서드는 정식버전에서 없음. preview기능으로 omit제공, 스키마 파일에 옵션 넣어야함.
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      omit: { password: true },
    });
    // 일치하는 사용자 없을 경우
    if (!user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.JWT.NO_USER });
    }
    // 인증 통과 시 유저 정보를 req.user에 담아 넘겨주기.
    req.user = user;
    return next();
  } catch (err) {
    next(err);
  }
};
