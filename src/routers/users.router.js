import express from 'express';

const router = express.Router();

router.get('/users', async (req, res, next) => {
  try {
    res.status(200).json({ message: 'user api' });
  } catch (err) {
    next(err);
  }
});
export default router;
