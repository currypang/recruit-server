import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import { requireRoles } from '../middlewares/require-roles.middleware.js';
import { USER_CONS } from '../constants/user.constant.js';
import { createResumeValidator } from '../middlewares/validators/create-resume.validator.middleware.js';
import { updateResumeStatusValidator } from '../middlewares/validators/update-resume-status.validator.middleware.js';
import { updateResumeValidator } from '../middlewares/validators/updated-resume-validator.middleware.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js';

const router = express.Router();

// 이력서 생성 API, accessToken 미들웨어로 인증, joi 미들웨어로 유효성 검사
// validateAccessToken 미들웨어는 resumes 라우터에 공통으로 들어가므로 index.js에서 설정 가능
router.post('/', createResumeValidator, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const user = req.user;
    const resume = await prisma.resume.create({
      data: {
        authorId: user.id,
        title,
        content,
      },
    });
    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.RESUMES.CREATE.SUCCEED,
      data: resume,
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 목록 조회 API, accessToken 미들웨어로 인증
router.get('/list', async (req, res, next) => {
  try {
    const { id, role } = req.user;
    // 삼항연산자로 리팩토링, sort값이 없으면 'desc'
    // sort가 있으면 소문자 변환, asc이면 asc / undefined거나 다르면 desc
    const sort = req.query.sort?.toLocaleLowerCase() === 'asc' ? 'asc' : 'desc';
    const status = req.query.status || '';

    // status 유무에 따른 조건 설정, 없으면 모두 출력 / role에 따라 userId 조건 설정 RECRUITER면 모두 출력
    //스프레드 문법으로 중복된 부분 리팩토링
    const condition = {
      ...(role !== USER_CONS.RECRUITER && { authorId: id }),
      ...(status && { status }),
    };
    // 조건에 따라 쿼리, include 사용해 관계 테이블 데이터 가져오기
    let resumeList = await prisma.resume.findMany({
      where: condition,
      orderBy: { createdAt: sort },
      include: {
        author: true,
      },
      // map을 쓰지 않고 아래와 같은 형식도 가능하긴 함. 리턴값이 깔끔하진 않음
      // select: {
      //   id: true,
      //   author: {
      //     select: {
      //       name: true,
      //     },
      //   },
      //   title: true,
      //   content: true,
      //   status: true,
      //   createdAt: true,
      //   updatedAt: true,
      // },
    });
    // 목록이라 map 사용
    resumeList = resumeList.map((resume) => {
      return {
        id: resume.id,
        authorName: resume.author.name,
        title: resume.title,
        content: resume.content,
        status: resume.status,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      };
    });
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_LIST.SUCCEED,
      data: resumeList,
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 상세 조회 API, accessToken 미들웨어로 인증
router.get('/:id', async (req, res, next) => {
  try {
    // 이력서 ID, 유저정보
    const { id } = req.params;
    const { role } = req.user;
    const authorId = req.user.id;

    // 리크루터는 모든 이력서에 접근이 가능
    // validateAccessToken에서 넘어오는 id는 숫자형이라 상관없지만, path parameter로 받는건 문자열이라 숫자로 변환이 필요하다.
    const condition = {
      ...(role !== USER_CONS.RECRUITER && { authorId }),
      ...{ id: +id },
    };
    // 이력서
    let resume = await prisma.resume.findFirst({
      where: condition,
      include: {
        author: true,
      },
    });
    // 이력서 정보가 없는 경우
    if (!resume) {
      return next('notExistResume');
    }
    // 이력서 있으면 리턴
    resume = {
      id: resume.id,
      authorName: resume.author.name,
      title: resume.title,
      content: resume.content,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };

    // 아래 방식도 되지만 정렬상태를 컨트롤 할 수 ㅓㅂㅅ다.
    // resume.authorName = resume.author.name;
    // resume.authorId = undefined;
    // resume.author = undefined;

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_DETAIL.SUCCEED,
      data: resume,
    });
  } catch (err) {
    next(err);
  }
});
// 이력서 수정 API, accessToken 미들웨어로 인증
router.put('/:id', updateResumeValidator, async (req, res, next) => {
  try {
    // prisma 메서드 사용위해 id 값 숫자형으로 변환
    const id = +req.params.id;
    const authorId = req.user.id;
    const { title, content } = req.body;

    // 이력서 id, 작성자 id가 일치하는 이력서
    const resume = await prisma.resume.findUnique({
      where: { id, authorId },
    });
    // 이력서가 없거나, 작성자가 다를 때
    if (!resume) {
      // return 없을 시 update 에러 발생
      return next('notExistResume');
    }
    // 이력서 수정 - "" 일때 덮어씌워져서 || 연산자로 title이 없을때는 title의 값 설정
    const updatedResume = await prisma.resume.update({
      where: { id: id, authorId },
      data: {
        title: title || resume.title,
        content: content || resume.content,
      },
      //아래 방식도 가능
      // data: {
      //   ...(title && { title }),
      //   ...(content && { content }),
      // },
    });
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.UPDATE.SUCCEED,
      data: updatedResume,
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 삭제 API, accessToken 미들웨어로 인증
router.delete('/:id', async (req, res, next) => {
  try {
    const id = +req.params.id;
    const authorId = req.user.id;

    // 이력서 id, 작성자 id가 일치하는 이력서
    const resume = await prisma.resume.findFirst({
      where: { id, authorId },
    });
    // 이력서가 없거나, 작성자가 다를 때
    if (!resume) {
      return next('notExistResume');
    }
    // 이력서 삭제
    const deletedResume = await prisma.resume.delete({
      // delete 메서드는 행 전체를 삭제, select는 삭제 후 리턴되는 필드를 결정
      where: { id, authorId },
    });
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.DELETE.SUCCEED,
      data: { id: deletedResume.id },
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 지원 상태 변경 API, accessToken 미들웨어, 역할 인증 미들웨어로 인증, joi 미들웨어로 유효성 검사
router.patch('/:id/status', requireRoles(USER_CONS.RECRUITER), updateResumeStatusValidator, async (req, res, next) => {
  try {
    // 전달받은 이력서 ID, 역할, 수정할 상태와 사유.
    const id = +req.params.id;
    const recruiterId = req.user.id;
    const { status, reason } = req.body;

    await prisma.$transaction(async (tx) => {
      const existedResume = await prisma.resume.findUnique({
        where: { id },
        // 이력서 정보가 없는 경우
      });
      if (!existedResume) {
        next('notExistResume');
      }
      console.log('111');
      // 이력서 지원 상태 수정
      const updatedResume = await tx.resume.update({
        where: { id },
        data: {
          status,
        },
      });
      // throw new Error('일부러 만든 에러');

      // 이력서 로그 생성
      const data = await tx.resumeLog.create({
        data: {
          recruiterId,
          resumeId: existedResume.id,
          oldStatus: existedResume.status,
          newStatus: updatedResume.status,
          reason,
        },
      });

      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.RESUMES.UPDATE.STATUS.SUCCEED,
        data,
      });
    });
  } catch (err) {
    next(err);
  }
});

// 이력서 로그 목록 조회 API, accessToken 미들웨어, 역할 인증 미들웨어로 인증
router.get('/:id/logs', requireRoles(USER_CONS.RECRUITER), async (req, res, next) => {
  try {
    const id = +req.params.id;
    let data = await prisma.resumeLog.findMany({
      where: {
        resumeId: id,
      },
      include: {
        recruiter: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    data = data.map((log) => {
      return {
        id: log.id,
        recruiterName: log.recruiter.name,
        resumeId: log.resumeId,
        oldStatus: log.oldStatus,
        newStatus: log.newStatus,
        reason: log.reason,
        createdAt: log.createdAt,
      };
    });

    res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_LIST.LOG.SUCCEED,
      data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
