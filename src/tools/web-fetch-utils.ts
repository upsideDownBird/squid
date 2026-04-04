import axios, { type AxiosResponse } from 'axios';
import { LRUCache } from 'lru-cache';
import TurndownService from 'turndown';

// 缓存配置
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 分钟
const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// HTTP 请求配置
const FETCH_TIMEOUT_MS = 30_000; // 30 秒超时
const MAX_HTTP_CONTENT_LENGTH = 10 * 1024 * 1024; // 10MB 最大内容长度
const MAX_URL_LENGTH = 2000;

// 缓存条目类型
type CacheEntry = {
  content: string;
  bytes: number;
  code: number;
  codeText: string;
  contentType: string;
};

// URL 缓存
const URL_CACHE = new LRUCache<string, CacheEntry>({
  maxSize: MAX_CACHE_SIZE_BYTES,
  ttl: CACHE_TTL_MS,
  sizeCalculation: (entry) => entry.bytes,
});

// Turndown 服务实例（延迟初始化）
let turndownService: TurndownService | null = null;

function getTurndownService(): TurndownService {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }
  return turndownService;
}

/**
 * 验证 URL 格式
 */
export function validateURL(url: string): boolean {
  if (url.length > MAX_URL_LENGTH) {
    return false;
  }

  try {
    const parsed = new URL(url);

    // 只允许 http 和 https 协议
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // 不允许包含用户名和密码
    if (parsed.username || parsed.password) {
      return false;
    }

    // 确保有有效的主机名
    const hostname = parsed.hostname;
    const parts = hostname.split('.');
    if (parts.length < 2) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 获取网页内容
 */
export async function fetchURL(
  url: string,
  signal?: AbortSignal
): Promise<{
  content: string;
  bytes: number;
  code: number;
  codeText: string;
  contentType: string;
}> {
  if (!validateURL(url)) {
    throw new Error('Invalid URL');
  }

  // 检查缓存
  const cachedEntry = URL_CACHE.get(url);
  if (cachedEntry) {
    return cachedEntry;
  }

  // 升级 http 到 https
  let fetchUrl = url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
      fetchUrl = parsed.toString();
    }
  } catch {
    // 如果解析失败，使用原始 URL
  }

  // 发起 HTTP 请求
  const response: AxiosResponse<ArrayBuffer> = await axios.get(fetchUrl, {
    signal,
    timeout: FETCH_TIMEOUT_MS,
    responseType: 'arraybuffer',
    maxContentLength: MAX_HTTP_CONTENT_LENGTH,
    validateStatus: () => true, // 接受所有状态码，不抛出异常
    headers: {
      Accept: 'text/html, text/markdown, */*',
      'User-Agent': 'Mozilla/5.0 (compatible; JobOpxBot/1.0)',
    },
  });

  const rawBuffer = Buffer.from(response.data);
  const bytes = rawBuffer.length;
  const contentType = response.headers['content-type'] ?? '';
  const htmlContent = rawBuffer.toString('utf-8');

  // 转换 HTML 到 Markdown
  let markdownContent: string;
  if (contentType.includes('text/html')) {
    markdownContent = htmlToMarkdown(htmlContent);
  } else {
    // 非 HTML 内容直接返回
    markdownContent = htmlContent;
  }

  // 存入缓存
  const entry: CacheEntry = {
    content: markdownContent,
    bytes,
    code: response.status,
    codeText: response.statusText,
    contentType,
  };

  URL_CACHE.set(url, entry);

  return entry;
}

/**
 * 将 HTML 转换为 Markdown
 */
export function htmlToMarkdown(html: string): string {
  try {
    const turndown = getTurndownService();
    return turndown.turndown(html);
  } catch (error) {
    // 如果转换失败，返回原始 HTML
    console.error('HTML to Markdown conversion failed:', error);
    return html;
  }
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  URL_CACHE.clear();
}
