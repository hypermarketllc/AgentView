import express from 'express';
import { bundleConsolePatch } from './bundleConsolePatch';

const router = express.Router();

router.post('/console/patch', async (req, res) => {
  try {
    await bundleConsolePatch();
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

export default router;