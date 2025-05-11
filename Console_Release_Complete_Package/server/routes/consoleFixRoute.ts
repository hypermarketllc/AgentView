import express from 'express';

const router = express.Router();

router.post('/fix', (req, res) => {
  // Example: run quick fix logic
  res.status(200).json({ success: true, message: 'Console fix applied.' });
});

export default router;