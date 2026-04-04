import type {
  TencentSkillHubCatalogItem,
  TencentSkillHubPackage,
  TencentSkillHubSkillDetail,
} from './tencent-skillhub-types';
import AdmZip from 'adm-zip';

export interface TencentSkillHubClientConfig {
  baseUrl: string;
  token?: string;
  indexUrl?: string;
  searchUrl?: string;
  primaryDownloadUrlTemplate?: string;
  fallbackDownloadUrlTemplate?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function normalizeOptionalUrl(url?: string): string | undefined {
  const value = (url || '').trim();
  if (!value) return undefined;
  return value.replace(/\/+$/, '');
}

function fillSlugTemplate(urlTemplate: string, slug: string): string {
  const raw = String(urlTemplate || '').trim();
  if (!raw) return '';
  if (!raw.includes('{slug}')) return raw;
  return raw.replaceAll('{slug}', encodeURIComponent(slug));
}

function firstNonEmptyString(obj: any, keys: string[]): string {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function collectDownloadCandidates(item: any): string[] {
  const keys = [
    'packageUrl',
    'package_url',
    'downloadUrl',
    'download_url',
    'zipUrl',
    'zip_url',
    'archiveUrl',
    'archive_url',
    'fileUrl',
    'file_url',
    'url',
  ];
  const out: string[] = [];
  for (const key of keys) {
    const v = firstNonEmptyString(item, [key]);
    if (v && !out.includes(v)) out.push(v);
  }
  if (Array.isArray(item?.downloadCandidates)) {
    for (const entry of item.downloadCandidates) {
      if (typeof entry === 'string' && entry.trim() && !out.includes(entry.trim())) {
        out.push(entry.trim());
      }
    }
  }
  return out;
}

async function readResponseBytes(response: Response): Promise<Uint8Array> {
  const maybeArrayBuffer = (response as any).arrayBuffer;
  if (typeof maybeArrayBuffer === 'function') {
    return new Uint8Array(await maybeArrayBuffer.call(response));
  }
  const maybeText = (response as any).text;
  if (typeof maybeText === 'function') {
    return new TextEncoder().encode(await maybeText.call(response));
  }
  throw new Error('Tencent SkillHub response body is unreadable');
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJsonResponse(response: Response, source: string): Promise<any> {
  const bodyText = await response.text();
  if (!bodyText) return {};
  const contentType = response.headers.get('content-type') || '';
  const bodyPreview = bodyText.slice(0, 200).trim();

  const maybeHtml =
    contentType.includes('text/html') ||
    /^<!doctype html/i.test(bodyPreview) ||
    /^<html/i.test(bodyPreview);

  if (maybeHtml) {
    throw new Error(
      `腾讯 SkillHub 返回了 HTML 页面（${source}, HTTP ${response.status}）。请检查 SkillHub API 地址是否正确（应为 JSON API 而非官网页面），并确认 token 配置是否有效。`
    );
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error(
      `腾讯 SkillHub 返回了非 JSON 响应（${source}, HTTP ${response.status}）。请检查 SkillHub API 配置。响应片段: ${bodyText.slice(0, 120)}`
    );
  }
}

export class TencentSkillHubClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly indexUrl?: string;
  private readonly searchUrl: string;
  private readonly primaryDownloadUrlTemplate: string;
  private readonly fallbackDownloadUrlTemplate: string;

  constructor(config: TencentSkillHubClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.token = config.token;
    this.indexUrl = normalizeOptionalUrl(config.indexUrl);
    this.searchUrl = normalizeOptionalUrl(config.searchUrl) || `${this.baseUrl}/search`;
    this.primaryDownloadUrlTemplate =
      (config.primaryDownloadUrlTemplate || '').trim() || `${this.baseUrl}/download?slug={slug}`;
    this.fallbackDownloadUrlTemplate =
      (config.fallbackDownloadUrlTemplate || '').trim() || '';
  }

  private normalizeCatalogItems(items: any[]): TencentSkillHubCatalogItem[] {
    return items
      .map((item: any) => ({
        slug: String(item.slug || ''),
        name: String(item.displayName || item.name || item.slug || ''),
        description: String(item.summary || item.description || ''),
        latestVersion: String(
          item.latestVersion?.version || item.latestVersion || item.version || ''
        ),
        homepage: item.homepage ? String(item.homepage) : undefined,
        iconUrl: firstNonEmptyString(item, ['iconUrl', 'icon_url', 'icon', 'logo', 'avatarUrl', 'avatar']),
        packageUrl: firstNonEmptyString(item, ['packageUrl', 'package_url', 'downloadUrl', 'download_url', 'zipUrl', 'zip_url']),
        downloadCandidates: collectDownloadCandidates(item),
      }))
      .filter((item: TencentSkillHubCatalogItem) => item.slug && item.name);
  }

  private async fetchIndexSkills(): Promise<TencentSkillHubCatalogItem[]> {
    if (!this.indexUrl) return [];
    const response = await fetch(this.indexUrl, {
      method: 'GET',
      headers: buildHeaders(this.token),
    });
    if (!response.ok) {
      throw new Error(`Tencent SkillHub index failed: HTTP ${response.status}`);
    }
    const json = await parseJsonResponse(response, 'skills index');
    const rawList = Array.isArray(json)
      ? json
      : Array.isArray(json.skills)
        ? json.skills
        : Array.isArray(json.items)
          ? json.items
          : [];
    return this.normalizeCatalogItems(rawList);
  }

  private async fetchSearchSkills(query: string, limit: number): Promise<TencentSkillHubCatalogItem[]> {
    const url = new URL(this.searchUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders(this.token),
    });
    if (!response.ok) {
      throw new Error(`Tencent SkillHub search failed: HTTP ${response.status}`);
    }
    const json = await parseJsonResponse(response, 'skills search');
    const rawList = Array.isArray(json.results)
      ? json.results
      : Array.isArray(json.skills)
        ? json.skills
        : Array.isArray(json.items)
          ? json.items
          : [];
    return this.normalizeCatalogItems(rawList);
  }

  async listSkills(params: {
    query?: string;
    limit?: number;
  }): Promise<TencentSkillHubCatalogItem[]> {
    const query = params.query?.trim() ?? '';
    const limit = params.limit ?? 20;
    const keyword = query.toLowerCase();

    if (query) {
      try {
        const remote = await this.fetchSearchSkills(query, limit);
        if (remote.length > 0) {
          return remote;
        }
      } catch {
        // Search endpoint may be unavailable; fallback to index filtering.
      }
    }

    const fromIndex = await this.fetchIndexSkills();
    const filtered = keyword
      ? fromIndex.filter((item) => {
          const haystack = `${item.slug} ${item.name} ${item.description}`.toLowerCase();
          return haystack.includes(keyword);
        })
      : fromIndex;
    return filtered.slice(0, Math.max(1, limit));
  }

  async getSkillDetail(slug: string): Promise<TencentSkillHubSkillDetail> {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) {
      throw new Error('Tencent SkillHub detail failed: slug is required');
    }
    const indexItems = await this.fetchIndexSkills();
    const exact = indexItems.find((item) => item.slug === normalizedSlug);
    const primaryByTemplate = fillSlugTemplate(this.primaryDownloadUrlTemplate, normalizedSlug);
    const fallbackByTemplate = fillSlugTemplate(this.fallbackDownloadUrlTemplate, normalizedSlug);
    if (exact) {
      const candidates = [
        ...(exact.downloadCandidates || []),
        exact.packageUrl || '',
        primaryByTemplate,
        fallbackByTemplate,
      ].filter(Boolean);
      return {
        ...exact,
        packageUrl: exact.packageUrl || candidates[0] || primaryByTemplate || fallbackByTemplate,
        downloadCandidates: Array.from(new Set(candidates)),
      };
    }

    const candidates = [primaryByTemplate, fallbackByTemplate].filter(Boolean);
    return {
      slug: normalizedSlug,
      name: normalizedSlug,
      description: '',
      latestVersion: '',
      packageUrl: candidates[0] || '',
      downloadCandidates: Array.from(new Set(candidates)),
    };
  }

  async downloadSkillPackage(
    slug: string,
    version: string,
    packageUrl?: string,
    downloadCandidates?: string[]
  ): Promise<TencentSkillHubPackage> {
    const candidates = Array.from(
      new Set(
        [
          packageUrl || '',
          ...(downloadCandidates || []),
          fillSlugTemplate(this.primaryDownloadUrlTemplate, slug),
          fillSlugTemplate(this.fallbackDownloadUrlTemplate, slug),
        ].filter(Boolean)
      )
    );
    if (!candidates.length) {
      throw new Error(`Tencent SkillHub download failed: no package url for ${slug}`);
    }

    let lastError = '';
    for (const requestUrl of candidates) {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          ...buildHeaders(this.token),
          Accept: 'application/json,application/zip,application/octet-stream,*/*',
        },
      });

      if (!response.ok) {
        lastError = `Tencent SkillHub download failed: HTTP ${response.status} (${requestUrl})`;
        continue;
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const payload = await readResponseBytes(response);
      const isZip =
        contentType.includes('application/zip') ||
        contentType.includes('application/octet-stream') ||
        (payload.length >= 4 &&
          payload[0] === 0x50 &&
          payload[1] === 0x4b &&
          (payload[2] === 0x03 || payload[2] === 0x05 || payload[2] === 0x07));

      if (contentType.includes('application/json') || contentType.includes('text/json')) {
        const text = new TextDecoder('utf-8').decode(payload);
        const json = JSON.parse(text);
        if (json.files && typeof json.files === 'object') {
          return {
            files: Object.fromEntries(
              Object.entries(json.files).map(([filePath, content]) => [String(filePath), String(content)])
            ),
          };
        }
        if (typeof json.content === 'string') {
          return { files: { 'SKILL.md': json.content } };
        }
        if (typeof json.downloadUrl === 'string') {
          const nested = await this.downloadSkillPackage(slug, version, json.downloadUrl, []);
          return nested;
        }
        lastError = `Tencent SkillHub package payload missing files/content (${requestUrl})`;
        continue;
      }

      if (isZip) {
        const zip = new AdmZip(Buffer.from(payload));
        const files: Record<string, string> = {};
        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          const fileName = entry.entryName.replace(/^\/+/, '');
          files[fileName] = entry.getData().toString('utf-8');
        }
        if (Object.keys(files).length > 0) {
          return { files };
        }
        lastError = `Tencent SkillHub zip package is empty (${requestUrl})`;
        continue;
      }

      const bodyText = new TextDecoder('utf-8').decode(payload);
      if (bodyText.trim()) {
        return {
          files: { 'SKILL.md': bodyText },
        };
      }
      lastError = `Tencent SkillHub package is empty (${requestUrl})`;
    }
    throw new Error(lastError || `Tencent SkillHub download failed for ${slug}@${version}`);
  }
}
