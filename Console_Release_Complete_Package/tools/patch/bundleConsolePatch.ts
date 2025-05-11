import { runPatch } from './runPatch';

export const bundleConsolePatch = async () => {
  try {
    await runPatch();
    console.log('✅ Patch bundle complete');
  } catch (e) {
    console.error('❌ Patch bundle failed', e);
  }
};