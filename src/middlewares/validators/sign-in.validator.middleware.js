import Joi from 'joi';

// 로그인 joi 유효성 검사
export const signInValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.empty': '이메일을 입력해 주세요.',
        'string.email': '이메일 형식이 올바르지 않습니다.',
        'any.required': '이메일을 입력해 주세요.',
      }),
      password: Joi.string().min(6).required().messages({
        'string.empty': '비밀번호를 입력해 주세요.',
        'any.required': '비밀번호를 입력해 주세요.',
      }),
    });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
