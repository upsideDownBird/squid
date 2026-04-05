import { mkdir, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { TencentSkillHubClient } from './tencent-skillhub-client';
import {
  readTencentSkillHubLockfile,
  writeTencentSkillHubLockfile,
  writeTencentSkillHubOrigin,
} from './tencent-skillhub-metadata';
import { validateTencentSkillHubPackage, writeTencentSkillHubPackage } from './tencent-skillhub-package';
import type { TencentSkillHubInstallResult } from './tencent-skillhub-types';

export interface TencentSkillHubInstallConfig {
  baseUrl: string;
  token?: string;
  skillsDir?: string;
  indexUrl?: string;
  searchUrl?: string;
  primaryDownloadUrlTemplate?: string;
  fallbackDownloadUrlTemplate?: string;
}

function normalizeSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (!normalized || !/^[a-z0-9-]+$/.test(normalized)) {
    throw new Error(`Invalid skill slug: ${slug}`);
  }
  return normalized;
}

function resolveSkillEntrypointContent(pkg: { files: Record<string, string> }): string | null {
  const entries = Object.entries(pkg.files || {});
  const direct = entries.find(([filePath]) => filePath.toLowerCase() === 'skill.md');
  if (direct) return direct[1];
  const nested = entries.find(([filePath]) => filePath.toLowerCase().endsWith('/skill.md'));
  return nested ? nested[1] : null;
}

export async function installTencentSkillHubSkill(params: {
  slug: string;
  version?: string;
  force?: boolean;
  config: TencentSkillHubInstallConfig;
}): Promise<TencentSkillHubInstallResult> {
  try {
    const slug = normalizeSlug(params.slug);
    const client = new TencentSkillHubClient({
      baseUrl: params.config.baseUrl,
      token: params.config.token,
      indexUrl: params.config.indexUrl,
      searchUrl: params.config.searchUrl,
      primaryDownloadUrlTemplate: params.config.primaryDownloadUrlTemplate,
      fallbackDownloadUrlTemplate: params.config.fallbackDownloadUrlTemplate,
    });
    const detail = await client.getSkillDetail(slug);
    const resolvedVersion =
      params.version || detail.latestVersion || detail.versions?.[0]?.version || 'latest';

    const pkg = await client.downloadSkillPackage(
      slug,
      resolvedVersion,
      detail.packageUrl,
      detail.downloadCandidates
    );
    validateTencentSkillHubPackage(pkg);

    const skillsDir = params.config.skillsDir || join(homedir(), '.squid', 'skills');
    const targetDir = join(skillsDir, slug);
    if (existsSync(targetDir) && !params.force) {
      return {
        success: false,
        slug,
        error: `Skill already exists: ${targetDir}. Re-run with force.`,
      };
    }

    if (params.force && existsSync(targetDir)) {
      await rm(targetDir, { recursive: true, force: true });
    }

    await mkdir(skillsDir, { recursive: true });
    await writeTencentSkillHubPackage(targetDir, pkg);
    const skillEntrypoint = resolveSkillEntrypointContent(pkg);
    if (skillEntrypoint) {
      // Backward-compatible flat entry for SkillLoader root scan.
      await writeFile(join(skillsDir, `${slug}.md`), skillEntrypoint, 'utf-8');
    }

    const lockfile = await readTencentSkillHubLockfile();
    const installedAt = Date.now();
    lockfile.skills[slug] = {
      version: resolvedVersion,
      installedAt,
    };
    await writeTencentSkillHubLockfile(lockfile);
    await writeTencentSkillHubOrigin({
      version: 1,
      registry: params.config.baseUrl,
      slug,
      installedVersion: resolvedVersion,
      installedAt,
    });

    return {
      success: true,
      slug,
      version: resolvedVersion,
      targetDir,
    };
  } catch (error) {
    return {
      success: false,
      slug: params.slug,
      error: (error as Error).message,
    };
  }
}
