import Joi from 'joi';

// 이력서 지원 상태 변경 joi 유효성 검사
export const updateResumeStatusValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      status: Joi.string()
        .required()
        .valid('APPLY', 'DROP', 'PASS', 'INTERVIEW1', 'INTERVIEW2', 'FINAL_PASS')
        .messages({
          'string.empty': '변경하고자 하는 지원 상태를 입력해 주세요.',
          'any.required': '변경하고자 하는 지원 상태를 입력해 주세요.',
          'any.only': '유효하지 않은 지원 상태입니다.',
        }),
      reason: Joi.string().required().messages({
        'string.empty': '지원 상태 변경 사유를 입력해 주세요.',
        'any.required': '지원 상태 변경 사유를 입력해 주세요.',
      }),
    });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
