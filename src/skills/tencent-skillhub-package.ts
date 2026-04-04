import { mkdir, writeFile } from 'fs/promises';
import { dirname, join, normalize } from 'path';
import type { TencentSkillHubPackage } from './tencent-skillhub-types';

function sanitizeRelativePath(filePath: string): string {
  const normalized = normalize(filePath).replace(/\\/g, '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.includes('../') ||
    normalized === '..'
  ) {
    throw new Error(`Unsafe package path: ${filePath}`);
  }
  return normalized;
}

export function validateTencentSkillHubPackage(pkg: TencentSkillHubPackage): void {
  const files = Object.keys(pkg.files || {});
  if (files.length === 0) {
    throw new Error('Invalid package: no files');
  }

  const hasSkillEntrypoint = files.some((filePath) => {
    const safePath = sanitizeRelativePath(filePath).toLowerCase();
    return safePath === 'skill.md' || safePath.endsWith('/skill.md');
  });

  if (!hasSkillEntrypoint) {
    throw new Error('Invalid package: missing SKILL.md');
  }
}

export async function writeTencentSkillHubPackage(targetDir: string, pkg: TencentSkillHubPackage): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  for (const [rawPath, content] of Object.entries(pkg.files)) {
    const safeRelativePath = sanitizeRelativePath(rawPath);
    const outputPath = join(targetDir, safeRelativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, 'utf-8');
  }
}
