import Joi from 'joi';

// 회원가입 joi 유효성 검사
export const signUpValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.empty': '이메일을 입력해 주세요.',
        'string.email': '이메일 형식이 올바르지 않습니다.',
        'any.required': '이메일을 입력해 주세요.',
      }),
      name: Joi.string().required().messages({
        'string.empty': '이름을 입력해 주세요.',
        'any.required': '이름을 입력해 주세요.',
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': '비밀번호 항목은 최소 6 글자 이상이어야 합니다.',
        'string.empty': '비밀번호를 입력해 주세요.',
        'any.required': '비밀번호를 입력해 주세요.',
      }),
      passwordConfirm: Joi.string()
        .min(6)
        .required()
        .valid(Joi.ref('password'))
        .messages({
          'string.min': '비밀번호 항목은 최소 6 글자 이상이어야 합니다.',
          'string.empty': '비번번호 확인을 입력해 주세요.',
          'any.required': '비번번호 확인을 입력해 주세요.',
          'any.only': '입력한 두 비밀번호가 일치하지 않습니다.',
        }),
    });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
