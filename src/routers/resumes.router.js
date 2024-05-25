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
router.get('/resumes/list', validateAccessToken, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    // 삼항연산자로 리팩토링, sort값이 없으면 'desc'
    // asc가 아닌 다른값으로 잘못 되면 오류 -> 오타로 입력해도 기본값인 'desc'로 출력해주는게 좋은걸까? -> 일단 오타나도 기본값 출력하게 수정
    // status 부분 오타 부분도 연결해줄지 고민해보기
    // sort가 있으면 소문자 변환, asc이면 asc / undefined거나 다르면 desc
    const sort = req.query.sort?.toLocaleLowerCase() === 'asc' ? 'asc' : 'desc';
    const status = req.query.status || '';
    // status 유무에 따른 조선 설정, 없으면 모두 출력 / role에따라 userId 조건 설정 RECRUITER면 모두 출력
    //스프레드로 문법으로 중복된 부분 리팩토링
    const condition = {
      ...(role !== 'RECRUITER' && { UserId: userId }),
      ...(status && { status }),
    };

    const resumeList = await prisma.resumes.findMany({
      where: condition,
      orderBy: { createdAt: sort },
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
  } catch (err) {
    next(err);
  }
});

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
      // 이력서 id, 작성자 id가 일치하는 이력서
      const resume = await prisma.resumes.findFirst({
        where: { resumeId, UserId: userId },
      });
      // 이력서가 없거나, 작성자가 다를 때
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

// 이력서 삭제 API
router.delete(
  '/resumes/:resumeId',
  validateAccessToken,
  async (req, res, next) => {
    try {
      const resumeId = +req.params.resumeId;
      const { userId } = req.user;
      // 이력서 id, 작성자 id가 일치하는 이력서
      const resume = await prisma.resumes.findFirst({
        where: { resumeId, UserId: userId },
      });
      // 이력서가 없거나, 작성자가 다를 때
      if (!resume) {
        return res.status(400).json({ message: '이력서가 존재하지 않습니다.' });
      }
      // 이력서 삭제
      const deletedResume = await prisma.resumes.delete({
        // delete 메서드는 행 전체를 삭제, select는 삭제 후 리턴되는 필드를 결정
        where: { resumeId, UserId: userId },
        select: { resumeId: true },
      });
      return res.status(200).json({ data: deletedResume, message: 'delete' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
