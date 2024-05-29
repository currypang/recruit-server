import express from 'express';
import { validateAccessToken } from '../middlewares/require-acess-token.middleware.js';
import { prisma } from '../utils/prisma.util.js';
import { requireRoles } from '../middlewares/require-roles.middleware.js';
import { RESUME_CONS } from '../constants/resume.constant.js';
import { createResumeValidator } from '../middlewares/validators/create-resume.validator.middleware.js';
import { updateResumeStatusValidator } from '../middlewares/validators/update-resume-status.validator.middleware.js';

const router = express.Router();

// 이력서 생성 API, accessToken 미들웨어로 인증, joi 미들웨어로 유효성 검사
router.post('/', validateAccessToken, createResumeValidator, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const user = req.user;
    const resume = await prisma.resumes.create({
      data: {
        UserId: user.userId,
        title,
        content,
      },
    });
    return res.status(200).json({
      status: 200,
      message: '이력서 생성이 성공하였습니다.',
      data: resume,
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 목록 조회 API, accessToken 미들웨어로 인증
router.get('/list', validateAccessToken, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    // 삼항연산자로 리팩토링, sort값이 없으면 'desc'
    // sort가 있으면 소문자 변환, asc이면 asc / undefined거나 다르면 desc
    const sort = req.query.sort?.toLocaleLowerCase() === 'asc' ? 'asc' : 'desc';
    const status = req.query.status || '';

    // status 유무에 따른 조건 설정, 없으면 모두 출력 / role에 따라 userId 조건 설정 RECRUITER면 모두 출력
    //스프레드 문법으로 중복된 부분 리팩토링
    const condition = {
      ...(role !== 'RECRUITER' && { UserId: userId }),
      ...(status && { status }),
    };
    // 조건에 따라 쿼리
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
      status: 200,
      message: '이력서 목록 조회가 성공하였습니다.',
      data: resumeList,
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 상세 조회 API, accessToken 미들웨어로 인증
router.get('/detail/:resumeId', validateAccessToken, async (req, res, next) => {
  try {
    // 이력서 ID, 유저정보
    const { resumeId } = req.params;
    const { userId, role } = req.user;
    // 리크루터는 모든 이력서에 접근이 가능
    // validateAccessToken에서 넘어오는 id는 숫자형이라 상관없지만, path parameter로 받는건 문자열이라 숫자로 변환이 필요하다.
    const condition = {
      ...(role !== 'RECRUITER' && { UserId: userId }),
      ...{ resumeId: +resumeId },
    };
    // 이력서
    const resume = await prisma.resumes.findFirst({
      where: condition,
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
    // 이력서 있으면 리턴
    if (resume) {
      return res.status(200).json({
        status: 200,
        message: '이력서 상세 조회가 성공했습니다.',
        data: resume,
      });
    }
    // 이력서 정보가 없는 경우
    return next('notExistResume');
  } catch (err) {
    next(err);
  }
});
// 이력서 수정 API, accessToken 미들웨어로 인증
router.patch('/:resumeId', validateAccessToken, async (req, res, next) => {
  try {
    // prisma 메서드 사용위해 id 값 숫자형으로 변환
    const resumeId = +req.params.resumeId;
    const { userId } = req.user;
    const { title, content } = req.body;
    // // 제목, 자기소개 둘 다 없는 경우
    if (!title && !content) {
      return next('emptyUpdateResume');
    }
    // 이력서 id, 작성자 id가 일치하는 이력서
    const resume = await prisma.resumes.findFirst({
      where: { resumeId, UserId: userId },
    });
    // 이력서가 없거나, 작성자가 다를 때
    if (!resume) {
      // return 없을 시 update 에러 발생
      return next('notExistResume');
    }
    // 이력서 수정 - "" 일때 덮어씌워져서 || 연산자로 title이 없을때는 title의 값 설정
    const updatedResume = await prisma.resumes.update({
      where: { resumeId },
      data: {
        title: title || resume.title,
        content: content || resume.content,
      },
    });
    return res.status(200).json({
      status: 200,
      message: '이력서 수정이 성공하였습니다.',
      data: updatedResume,
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 삭제 API, accessToken 미들웨어로 인증
router.delete('/:resumeId', validateAccessToken, async (req, res, next) => {
  try {
    const resumeId = +req.params.resumeId;
    const { userId } = req.user;
    // 이력서 id, 작성자 id가 일치하는 이력서
    const resume = await prisma.resumes.findFirst({
      where: { resumeId, UserId: userId },
    });
    // 이력서가 없거나, 작성자가 다를 때
    if (!resume) {
      return next('notExistResume');
    }
    // 이력서 삭제
    const deletedResume = await prisma.resumes.delete({
      // delete 메서드는 행 전체를 삭제, select는 삭제 후 리턴되는 필드를 결정
      where: { resumeId, UserId: userId },
      select: { resumeId: true },
    });
    return res.status(200).json({
      status: 200,
      message: '이력서 삭제에 성공하였습니다.',
      data: deletedResume,
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 지원 상태 변경 API, accessToken 미들웨어, 역할 인증 미들웨어로 인증, joi 미들웨어로 유효성 검사
router.patch(
  '/:resumeId/status',
  validateAccessToken,
  requireRoles(RESUME_CONS.passedRole),
  updateResumeStatusValidator,
  async (req, res, next) => {
    try {
      // 전달받은 이력서 ID, 역할, 수정할 상태와 사유.
      const resumeId = +req.params.resumeId;
      const { userId } = req.user;
      const { status, reason } = req.body;

      // 이력서 정보가 없는 경우
      const resume = await prisma.resumes.findFirst({
        where: { resumeId },
      });
      if (!resume) {
        next('notExistResume');
      }
      // 예전 상태 설정
      const oldStatus = resume.status;

      // 이력서 상태 변경, 이력서 로그 생성 - transaction으로 묶기
      const resumeLog = await prisma.$transaction(async (tx) => {
        await tx.resumes.update({
          where: { resumeId },
          data: {
            status,
          },
        });
        // 이력서 로그 생성 tx.다음의 참조부분 모두 소문자가 아닌 camelCase로 써야함.
        const resumeLog = await tx.resumeLogs.create({
          data: {
            RecruiterId: userId,
            ResumeId: resumeId,
            oldStatus: oldStatus,
            newStatus: status,
            reason: reason,
          },
        });
        return resumeLog;
      });

      return res.status(200).json({
        status: 200,
        message: '이력서 지원 상태가 변경되었습니다.',
        data: resumeLog,
      });
    } catch (err) {
      next(err);
    }
  },
);

// 이력서 로그 목록 조회 API, accessToken 미들웨어, 역할 인증 미들웨어로 인증
router.get('/:resumeId/logs', validateAccessToken, requireRoles(['RECRUITER']), async (req, res, next) => {
  const resumeId = +req.params.resumeId;
  const resumeLogs = await prisma.resumeLogs.findMany({
    where: {
      ResumeId: resumeId,
    },
    select: {
      resumeLogId: true,
      Recruiter: {
        select: { name: true },
      },
      ResumeId: true,
      oldStatus: true,
      newStatus: true,
      reason: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({
    status: 200,
    message: '이력서 로그 목록이 조회되었습니다.',
    data: resumeLogs,
  });
});

export default router;
