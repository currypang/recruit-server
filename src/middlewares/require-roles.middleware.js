export const requireRoles = (params) => {
  // 매개변수를 받아와 사용하기 위해 고차함수 사용
  // 내 정보 조회 api를 수정해서 작동되는지 미리 확인함.
  return (req, res, next) => {
    try {
      const { role } = req.user;
      // role이 배열에 포함이면 인증, 배열에 포함될 role이 늘어날 경우를 대비해 includes 메서드 사용
      if (params.includes(role)) {
        //return을 안쓰면 아래코드는 계속 실행되는듯, 넘겨주는 미들웨어의 return이랑 겹치는지 확인
        // 요구사항의 반환 없다는 말이 return을 쓰지 말라는 것인지, 단순히 값을 남기지 말고 return next()하라는것인지 확인
        return next();
      }
      return res.status(401).json({ errorMessage: '접근 권한이 없습니다' });
    } catch (err) {
      return next(err);
    }
  };
};
