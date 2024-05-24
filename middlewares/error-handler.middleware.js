export const errorHandler = (err, req, res, next) => {
  console.log('errormiddleware 작동');
  return res
    .status(500)
    .json({ errorMessage: '현재 요청을 처리할 수 없습니다' });
};
