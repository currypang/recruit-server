import express from 'express';
import { authRouter } from './auth.router.js';
import resumesRouter from './resumes.router.js';
import { userRouter } from './users.router.js';
import { validateAccessToken } from '../middlewares/require-acess-token.middleware.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/resumes', validateAccessToken, resumesRouter);
router.use('/users', userRouter);

// aws 확인용
router.get('/health-check', async (req, res, next) => {
  try {
    // throw new Error('예상치 못한 에러');
    return res.status(200).send('healthy');
  } catch (err) {
    next(err);
  }
});
export default router;
