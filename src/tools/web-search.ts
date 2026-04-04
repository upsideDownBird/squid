import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';

const WebSearchInputSchema = z.object({
  query: z.string().describe('搜索查询'),
  max_results: z.number().optional().describe('最大结果数量（默认 10）')
});

type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebSearchOutput {
  success: boolean;
  query: string;
  results: SearchResult[];
  count: number;
  error?: string;
}

export const WebSearchTool: Tool<typeof WebSearchInputSchema, WebSearchOutput> = {
  name: 'web_search',
  description: '使用 DuckDuckGo 搜索网页。返回搜索结果列表（标题、链接、摘要）。',
  inputSchema: WebSearchInputSchema,
  maxResultSizeChars: 50000,

  async call(
    input: WebSearchInput,
    context: ToolContext
  ): Promise<ToolResult<WebSearchOutput>> {
    try {
      const maxResults = Math.min(input.max_results || 10, 10);

      if (!input.query || input.query.trim() === '') {
        return {
          data: {
            success: false,
            query: input.query,
            results: [],
            count: 0,
            error: '搜索查询不能为空'
          }
        };
      }

      // 使用 DuckDuckGo HTML 搜索
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(input.query)}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      // 解析 HTML
      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      // DuckDuckGo HTML 结果在 .result 类中
      $('.result').each((index, element) => {
        if (results.length >= maxResults) {
          return false; // 停止迭代
        }

        const $result = $(element);
        const $title = $result.find('.result__a');
        const $snippet = $result.find('.result__snippet');
        const $link = $result.find('.result__url');

        const title = $title.text().trim();
        const snippet = $snippet.text().trim();
        let link = $title.attr('href') || '';

        // DuckDuckGo 使用重定向链接，需要提取实际 URL
        if (link.startsWith('//duckduckgo.com/l/?')) {
          const urlMatch = link.match(/uddg=([^&]+)/);
          if (urlMatch) {
            link = decodeURIComponent(urlMatch[1]);
          }
        }

        if (title && link) {
          results.push({
            title,
            link,
            snippet: snippet || '无摘要'
          });
        }
      });

      return {
        data: {
          success: true,
          query: input.query,
          results,
          count: results.length
        }
      };
    } catch (error) {
      return {
        data: {
          success: false,
          query: input.query,
          results: [],
          count: 0,
          error: `搜索失败: ${(error as Error).message}`
        },
        error: (error as Error).message
      };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: WebSearchOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content.success) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: `搜索失败: ${content.error || '未知错误'}`,
        is_error: true
      };
    }

    let output = `搜索查询: ${content.query}\n找到 ${content.count} 条结果\n\n`;

    content.results.forEach((result, index) => {
      output += `${index + 1}. ${result.title}\n`;
      output += `   链接: ${result.link}\n`;
      output += `   摘要: ${result.snippet}\n\n`;
    });

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: output.trim()
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  isDestructive: () => false
};
