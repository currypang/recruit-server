import Joi from 'joi';
import { MESSAGES } from '../../constants/message.constant.js';
import { RESUME_CONS } from '../../constants/resume.constant.js';

// 이력서 지원 상태 변경 joi 유효성 검사
export const updateResumeStatusValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      status: Joi.string()
        .required()
        .valid(...Object.values(RESUME_CONS.RESUME_STATUS))
        .messages({
          'string.empty': MESSAGES.RESUMES.UPDATE.STATUS.NO_STATUS,
          'any.required': MESSAGES.RESUMES.UPDATE.STATUS.NO_STATUS,
          'any.only': MESSAGES.RESUMES.UPDATE.STATUS.INVALID_STATUS,
        }),
      reason: Joi.string().required().messages({
        'string.empty': MESSAGES.RESUMES.UPDATE.STATUS.NO_REASON,
        'any.required': MESSAGES.RESUMES.UPDATE.STATUS.NO_REASON,
      }),
    });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
