import express from 'express';
import authRouter from './auth.router.js';
import resumesRouter from './resumes.router.js';
import usersRouter from './users.router.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/resumes', resumesRouter);
router.use('/users', usersRouter);

export default router;
