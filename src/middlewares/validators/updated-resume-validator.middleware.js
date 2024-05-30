import Joi from 'joi';
import { RESUME_CONS } from '../../constants/resume.constant.js';
import { MESSAGES } from '../../constants/message.constant.js';

// 이력서 수정 joi 유효성 검사
export const updateResumeValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      title: Joi.string(),
      content: Joi.string().min(RESUME_CONS.MIN_RESUME_LENGTH).messages({
        'string.min': MESSAGES.RESUMES.COMMON.CONTENT.MIN_LENGTH,
      }),
      // title, content 둘중에 하나
    })
      .min(1)
      .message({
        'object.min': MESSAGES.RESUMES.UPDATE.NO_BODY_DATA,
      });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
