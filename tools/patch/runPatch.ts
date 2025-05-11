import { runAllPatches } from './patchRegistry';

(async () => {
  console.log('🔧 Running patch suite...');
  const result = await runAllPatches();
  console.log(result.success ? '✅ All patches applied' : '❌ Patch errors:', result.errors);
})();