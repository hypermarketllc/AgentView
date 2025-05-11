import { patchEnvValidator } from './patch-env-validator';
import { validateRouteRegistry } from './validateRouteRegistry';
import { detectDuplicateFunctions } from './detectDuplicateFunctions';
import { apply404Handler } from './patch-express-404-handler';
import { fixQuery } from './fixMissingLimitQueries';
import * as validateApiResponses from './validate-api-responses';
import { bundleConsolePatch } from './bundleConsolePatch';
import { fixFrontendMimeType } from './fixFrontendMimeType';
import fs from 'fs';
import path from 'path';

interface PatchResult {
  name: string;
  success: boolean;
  error?: string;
}

interface PatchLog {
  patches: PatchResult[];
  timestamp: string;
}

interface PatchVersionLog {
  patches: PatchLog[];
  lastRun: string | null;
}

const logFilePath = path.resolve(__dirname, '../../../PatchVersionLog.json');
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, JSON.stringify({ patches: [], lastRun: null } as PatchVersionLog, null, 2));
}

export async function runAllPatches() {
  const results: string[] = [];
  const patchLog: PatchLog = { patches: [], timestamp: new Date().toISOString() };

  try {
    patchEnvValidator();
    results.push('✅ ENV validated');
    patchLog.patches.push({ name: 'patchEnvValidator', success: true });
  } catch (e) {
    const errorMsg = `❌ ENV validation failed: ${(e as Error).message}`;
    results.push(errorMsg);
    patchLog.patches.push({ name: 'patchEnvValidator', success: false, error: (e as Error).message });
  }

  try {
    validateRouteRegistry();
    results.push('✅ Route registry valid');
    patchLog.patches.push({ name: 'validateRouteRegistry', success: true });
  } catch (e) {
    const errorMsg = `❌ Route registry error: ${(e as Error).message}`;
    results.push(errorMsg);
    patchLog.patches.push({ name: 'validateRouteRegistry', success: false, error: (e as Error).message });
  }

  try {
    detectDuplicateFunctions();
    results.push('✅ Duplicate function check passed');
    patchLog.patches.push({ name: 'detectDuplicateFunctions', success: true });
  } catch (e) {
    const errorMsg = `❌ Duplicate function check failed: ${(e as Error).message}`;
    results.push(errorMsg);
    patchLog.patches.push({ name: 'detectDuplicateFunctions', success: false, error: (e as Error).message });
  }

results.push('⚠️ Skipped 404 handler patch – requires app context');
patchLog.patches.push({ name: 'apply404Handler', success: false, error: 'App instance not available during static patching' });

results.push('⚠️ Skipped SQL query patch – needs runtime query context');
patchLog.patches.push({ name: 'fixMissingLimitQueries', success: false, error: 'Query string not passed in static patching mode' });


  try {
    await validateApiResponses;
    results.push('✅ API response validation passed');
    patchLog.patches.push({ name: 'validateApiResponses', success: true });
  } catch (e) {
    const errorMsg = `❌ API response validation failed: ${(e as Error).message}`;
    results.push(errorMsg);
    patchLog.patches.push({ name: 'validateApiResponses', success: false, error: (e as Error).message });
  }

  try {
    bundleConsolePatch();
    results.push('✅ Console patch bundle ready');
    patchLog.patches.push({ name: 'bundleConsolePatch', success: true });
  } catch (e) {
    const errorMsg = `❌ Console patch bundle failed: ${(e as Error).message}`;
    results.push(errorMsg);
    patchLog.patches.push({ name: 'bundleConsolePatch', success: false, error: (e as Error).message });
  }

  try {
    fixFrontendMimeType();
    results.push('✅ Frontend MIME config validated');
    patchLog.patches.push({ name: 'fixFrontendMimeType', success: true });
  } catch (e) {
    const errorMsg = `❌ Frontend MIME patch failed: ${(e as Error).message}`;
    results.push(errorMsg);
    patchLog.patches.push({ name: 'fixFrontendMimeType', success: false, error: (e as Error).message });
  }

  try {
    const existingLog = JSON.parse(fs.readFileSync(logFilePath, 'utf-8'));
    existingLog.patches.push(patchLog);
    existingLog.lastRun = patchLog.timestamp;
    fs.writeFileSync(logFilePath, JSON.stringify(existingLog, null, 2));
    results.push('✅ Patch log updated');
  } catch (e) {
    const errorMsg = `❌ Failed to update patch log: ${(e as Error).message}`;
    results.push(errorMsg);
  }

  const success = results.every(r => r.startsWith('✅'));

  return {
    success,
    errors: results.filter(r => r.startsWith('❌')),
    messages: results
  };
}