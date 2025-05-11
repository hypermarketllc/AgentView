import express from 'express';

const router = express.Router();

router.post('/patch', (req, res) => {
  // trigger patch suite
  res.json({ status: 'Patches applied' });
});

export default router;