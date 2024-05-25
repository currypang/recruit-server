import express from 'express';
import { validateAccessToken } from '../middlewares/require-acess-token.middleware.js';
import { prisma } from '../utils/prisma.util.js';

const router = express.Router();

router.post('/resumes', validateAccessToken, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const user = req.user;
    // 제목, 자기소개 중 하나라도 빠진 경우
    if (!title || !content) {
      return res
        .status(400)
        .json({ errorMessage: '정보를 모두 입력해 주세요' });
    }
    // 자기소개 글자수가 150자 보다 짦은 경우
    if (content.length < 150) {
      return res
        .status(400)
        .json({ errorMessage: '자기소개는 150자 이상 작성해야 합니다.' });
    }
    const resume = await prisma.resumes.create({
      data: {
        UserId: user.userId,
        title,
        content,
      },
    });
    return res
      .status(200)
      .json({ data: resume, message: '이력서 생성이 성공하였습니다.' });
  } catch (err) {
    next(err);
  }
});

// 이력서 목록 조회 API
// params 뒤에 ? 붙여서 값 없을때도 작동 -> sort값 undefined로 인해 오류발생 -> || 연산자 사용하여 값없을때 'blank' 값 할당
router.get(
  '/resumes/list/:sort?',
  validateAccessToken,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const sort = req.params.sort || 'blank';
      // path parameter가 ASC이면 과거순 정렬
      if (sort.toLocaleLowerCase() === 'asc') {
        const resumeList = await prisma.resumes.findMany({
          where: { UserId: userId },
          orderBy: { createdAt: 'asc' },
          select: {
            resumeId: true,
            User: {
              select: {
                name: true,
              },
            },
            title: true,
            content: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return res.status(200).json({
          data: resumeList,
          message: '이력서 목록 조회가 성공하였습니다.',
        });
      }
      // path parameter가 없거나 DESC면 최신순 정렬
      const resumeList = await prisma.resumes.findMany({
        where: { UserId: userId },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({
        data: resumeList,
        message: '이력서 목록 조회가 성공하였습니다.',
      });
    } catch (err) {
      next(err);
    }
  },
);

// 이력서 상세 조회 API
router.get(
  '/resumes/detail/:resumeId',
  validateAccessToken,
  async (req, res, next) => {
    try {
      // 이력서 ID, 유저정보
      const { resumeId } = req.params;
      const { userId } = req.user;
      // 이력서 정보가 없는 경우
      const resume = await prisma.resumes.findFirst({
        // validateAccessToken에서 넘어오는 id는 숫자형이라 상관없지만, path parameter로 받는건 문자열이라 숫자로 변환이 필요하다.
        where: { resumeId: +resumeId },
        select: {
          resumeId: true,
          UserId: true,
          User: {
            select: {
              name: true,
            },
          },
          title: true,
          content: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      console.log(resume.UserId);
      if (resume && userId === resume.UserId) {
        // 유저ID 확인만하고 없앨 수 있는 다른 방법 있나 찾아보기
        delete resume.UserId;
        return res
          .status(200)
          .json({ data: resume, message: '이력서 상세 조회가 성공했습니다.' });
      }
      return res
        .status(400)
        .json({ errorMessage: '이력서가 존재하지 않습니다.' });
    } catch (err) {
      next(err);
    }
  },
);
// 이력서 수정 API
router.patch(
  '/resumes/:resumeId',
  validateAccessToken,
  async (req, res, next) => {
    try {
      // prisma 메서드 사용위해 id 값 숫자형으로 변환
      const resumeId = +req.params.resumeId;
      const { userId } = req.user;
      const { title, content } = req.body;
      // 제목, 자기소개 둘 다 없는 경우
      if (!title && !content) {
        return res
          .status(400)
          .json({ message: '수정할 정보를 입력해 주세요.' });
      }
      // path parameter로 받아온 ID의 이력서
      // resumeId가 일치하고, userId가 일치하는 이력서
      const resume = await prisma.resumes.findFirst({
        where: { resumeId, UserId: userId },
      });
      // 이력서 정보가 없거나, 이력서를 작성한 유저가 아닌경우
      if (!resume) {
        return res.status(400).json({ message: '이력서가 존재하지 않습니다.' });
      }
      // 이력서 수정 - "" 일때 덮어씌워져서 || 연산자로 title이 없을때는 title의 값 설정
      const updatedResume = await prisma.resumes.update({
        where: { resumeId },
        data: {
          title: title || resume.title,
          content: content || resume.content,
        },
      });
      return res
        .status(200)
        .json({ data: updatedResume, message: 'uptageResume' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
