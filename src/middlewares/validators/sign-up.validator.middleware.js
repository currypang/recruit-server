import Joi from 'joi';
import { MESSAGES } from '../../constants/message.constant.js';
import { AUTH_CONS } from '../../constants/auth.constant.js';

export const signUpValidator = async (req, res, next) => {
  try {
    // 회원가입 joi 유효성 검사
    const joischema = Joi.object({
      email: Joi.string().email().required().messages({
        //~~~:""인 경우 위해 empty 설정
        'string.empty': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
        'string.email': MESSAGES.AUTH.COMMON.EMAIL.INVALID_FORMAT,
        'any.required': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
      }),
      name: Joi.string().required().messages({
        'string.empty': MESSAGES.AUTH.COMMON.NAME.REQURIED,
        'any.required': MESSAGES.AUTH.COMMON.NAME.REQURIED,
      }),
      password: Joi.string().min(AUTH_CONS.MIN_PASSWORD_LENGTH).required().messages({
        'string.min': MESSAGES.AUTH.COMMON.PASSWORD.MIN_LENGTH,
        'string.empty': MESSAGES.AUTH.COMMON.PASSWORD.REQURIED,
        'any.required': MESSAGES.AUTH.COMMON.PASSWORD.REQURIED,
      }),
      passwordConfirm: Joi.string().min(AUTH_CONS.MIN_PASSWORD_LENGTH).required().valid(Joi.ref('password')).messages({
        'string.empty': MESSAGES.AUTH.COMMON.PASSWORD_CONFIRM.REQURIED,
        'any.required': MESSAGES.AUTH.COMMON.PASSWORD_CONFIRM.REQURIED,
        'any.only': MESSAGES.AUTH.COMMON.PASSWORD_CONFIRM.NOT_MACHTED_WITH_PASSWORD,
      }),
    });
    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
