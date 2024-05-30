import Joi from 'joi';
import { RESUME_CONS } from '../../constants/resume.constant.js';
import { MESSAGES } from '../../constants/message.constant.js';

// 이력서 생성 joi 유효성 검사
export const createResumeValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      title: Joi.string().required().messages({
        'string.empty': MESSAGES.RESUMES.COMMON.TITLE.REQUIRED,
        'any.required': MESSAGES.RESUMES.COMMON.TITLE.REQUIRED,
      }),
      content: Joi.string().min(RESUME_CONS.MIN_RESUME_LENGTH).required().messages({
        'string.empty': MESSAGES.RESUMES.COMMON.CONTENT.REQUIRED,
        'string.min': MESSAGES.RESUMES.COMMON.CONTENT.MIN_LENGTH,
        'any.required': MESSAGES.RESUMES.COMMON.CONTENT.REQUIRED,
      }),
    });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
