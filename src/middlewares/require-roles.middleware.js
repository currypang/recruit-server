import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js';

// 역할 인가 미들웨어
export const requireRoles = (params) => {
  // 매개변수를 받아와 사용하기 위해 고차함수 사용
  return (req, res, next) => {
    try {
      const user = req.user;
      const hasPermission = user && params.includes(user.role);
      // role이 배열에 포함이면 인증, 배열에 포함될 role이 늘어날 경우를 대비해 includes 메서드 사용 / API에서 배열로 전달해서 멀티로 역할 부여 하게끔 작성
      if (!hasPermission) {
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({ status: HTTP_STATUS.FORBIDDEN, message: MESSAGES.AUTH.COMMON.FORBIDDEN });
      }
      next();
    } catch (err) {
      return next(err);
    }
  };
};
