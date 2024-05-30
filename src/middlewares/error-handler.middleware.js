import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js';
// 본문에선 next넘겨주는 구문 없어도 사용해야 미들웨어로 받아올 수 있다. -> next 없으면 미들웨어로 인식하지 않는듯?
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // 조이 유효성 검사 처리
  if (err.isJoi) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ status: HTTP_STATUS.BAD_REQUEST, message: err.message });
  }
  // users 회원가입 시 이메일 중복 처리
  if (err === 'existUser') {
    return res
      .status(HTTP_STATUS.CONFLICT)
      .json({ status: HTTP_STATUS.CONFLICT, message: MESSAGES.AUTH.COMMON.EMAIL.DUPLICATED });
  }
  // auth 로그인 이메일로 조회안되거나 비밀번호가 일치하지 않을 경우
  if (err === 'invalidSignIn') {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ status: HTTP_STATUS.UNAUTHORIZED, message: MESSAGES.AUTH.COMMON.UNAUTHORIZED });
  }
  // 이력서 상세 목록 조회, 이력서 수정, 이력서 삭제, 이력서 지원 상태 변경 API에서 이력서 목록이 없을 경우
  if (err === 'notExistResume') {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ status: HTTP_STATUS.NOT_FOUND, message: MESSAGES.RESUMES.COMMON.NOT_FOUND });
  }
  // 제목, 자기소개 둘다 없는 경우
  if (err === 'emptyUpdateResume') {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ status: HTTP_STATUS.BAD_REQUEST, message: '수정할 정보를 입력해 주세요.' });
  }
  return res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: '현재 요청을 처리할 수 없습니다' });
};
