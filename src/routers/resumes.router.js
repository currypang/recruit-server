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
      res.status(400).json({ errorMessage: '정보를 모두 입력해 주세요' });
    }
    // 자기소개 글자수가 150자 보다 짦은 경우
    if (content.length < 150) {
      res
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
    res
      .status(200)
      .json({ data: resume, message: '이력서 생성이 성공하였습니다.' });
  } catch (err) {
    next(err);
  }
});

export default router;
