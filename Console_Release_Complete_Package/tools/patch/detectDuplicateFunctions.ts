import fs from 'fs';
import path from 'path';

export function detectDuplicateFunctions(): void {
  const root = path.resolve(__dirname, '../../../Console_Release_Complete_Package');
  const ignoredDirs = ['__tests__', 'tests', 'scripts', 'patch', 'node_modules'];

  const walk = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (!ignoredDirs.includes(file)) {
          results = results.concat(walk(fullPath));
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
    return results;
  };

  const tsFiles = walk(root);
  const functionNamePattern = /function\s+(\w+)/g;
  const classMethodPattern = /class\s+\w+\s*{[^}]*}/gs;

  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Skip functions declared inside classes
    const cleanedContent = content.replace(classMethodPattern, '');

    const matches = [...cleanedContent.matchAll(functionNamePattern)];
    for (const match of matches) {
      const fnName = match[1];
      if (seen.has(fnName)) {
        duplicates.push(fnName);
      } else {
        seen.add(fnName);
      }
    }
  }

  if (duplicates.length) {
    throw new Error(`Duplicate function names found: ${[...new Set(duplicates)].join(', ')}`);
  }

  console.log('✅ No duplicate functions found');
}