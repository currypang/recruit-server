export const errorHandler = (err, req, res, next) => {
  // 조이 유효성 검사 처리
  if (err.isJoi) {
    return res.status(400).json({
      status: 400,
      Message: err.message,
    });
  }
  // users 회원가입 시 이메일 중복 처리
  if (err === 'existUser') {
    return res
      .status(400)
      .json({ status: 400, message: '이미 가입 된 사용자입니다' });
  }
  // auth 로그인 이메일로 조회안되거나 비밀번호가 일치하지 않을 경우
  if (err === 'invalidSignIn') {
    return res
      .status(401)
      .json({ status: 401, message: '인증 정보가 유효하지 않습니다.' });
  }
  // 이력서 상세 목록 조회, 이력서 수정, 이력서 삭제, 이력서 지원 상태 변경 API에서 이력서 목록이 없을 경우
  if (err === 'notExistResume') {
    return res
      .status(401)
      .json({ status: 401, message: '이력서가 존재하지 않습니다.' });
  }
  // 제목, 자기소개 둘다 없는 경우
  if (err === 'emptyUpdateResume') {
    return res
      .status(400)
      .json({ status: 400, message: '수정할 정보를 입력해 주세요.' });
  }
  return res
    .status(500)
    .json({ err, status: 500, errorMessage: '현재 요청을 처리할 수 없습니다' });
};
