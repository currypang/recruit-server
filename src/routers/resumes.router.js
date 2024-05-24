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
router.get('/resumes/:sort?', validateAccessToken, async (req, res, next) => {
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
});

export default router;
