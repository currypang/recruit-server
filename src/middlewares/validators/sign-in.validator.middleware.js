import Joi from 'joi';
import { MESSAGES } from '../../constants/message.constant.js';

// 로그인 joi 유효성 검사
export const signInValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.empty': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
        'string.email': MESSAGES.AUTH.COMMON.EMAIL.INVALID_FORMAT,
        'any.required': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
      }),
      // 로그인 시 6글자 제한 없애기. 악의적인 접근에 취약해질 수 있다.
      password: Joi.string().required().messages({
        'string.empty': MESSAGES.AUTH.COMMON.PASSWORD.REQURIED,
        'any.required': MESSAGES.AUTH.COMMON.PASSWORD.REQURIED,
      }),
    });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
