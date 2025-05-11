import { runAllPatches } from './patchRegistry';

export async function runPatch() {
  try {
    const result = await runAllPatches();
    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.warn('⚠️ Non-blocking error during patch execution:', error.message);
    return {
      success: false,
      errors: [error.message],
      messages: []
    };
  }
}

// Optional: allow standalone CLI execution
if (require.main === module) {
  runPatch().then(result => {
    console.log('✅ Patch completed:', result);
  }).catch(err => {
    console.error('❌ Patch failed:', err);
    process.exit(1);
  });
}