import Joi from 'joi';

// 이력서 생성 joi 유효성 검사
export const createResumeValidator = async (req, res, next) => {
  try {
    const joischema = Joi.object({
      title: Joi.string().required().messages({
        'string.empty': '제목을 입력해 주세요.',
        'any.required': '제목을 입력해 주세요.',
      }),
      content: Joi.string().min(150).required().messages({
        'string.empty': '자기소개를 입력해 주세요.',
        'string.min': '자기소개는 최소 150자 이상 작성해야 합니다.',
        'any.required': '자기소개를 입력해 주세요.',
      }),
    });

    await joischema.validateAsync(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
