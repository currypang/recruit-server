import express from 'express';

const router = express.Router();

router.get('/resumes', async (req, res, next) => {
  try {
    res.status(200).json({ message: 'resume api' });
  } catch (err) {
    next(err);
  }
});

export default router;
