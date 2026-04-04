import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Tool } from '../tools/base';
import { z } from 'zod';

export class MCPToolAdapter {
  async loadTools(client: Client): Promise<Tool[]> {
    const response = await client.listTools();
    return response.tools.map(mcpTool => this.adaptTool(client, mcpTool));
  }

  private adaptTool(client: Client, mcpTool: any): Tool {
    const inputSchema = z.object(
      Object.fromEntries(
        Object.entries(mcpTool.inputSchema?.properties || {}).map(([key, prop]: [string, any]) => [
          key,
          prop.type === 'string' ? z.string() : z.any()
        ])
      )
    );

    return {
      name: `mcp:${mcpTool.name}`,
      description: mcpTool.description || '',
      inputSchema,
      maxResultSizeChars: 50000,
      async call(input, context) {
        const result = await client.callTool({ name: mcpTool.name, arguments: input });
        return { data: JSON.stringify(result.content) };
      },
      mapToolResultToToolResultBlockParam(content, toolUseID) {
        return {
          type: 'tool_result',
          tool_use_id: toolUseID,
          content: typeof content === 'string' ? content : JSON.stringify(content)
        };
      },
      isConcurrencySafe: () => false,
      isReadOnly: () => true,
      isDestructive: () => false
    };
  }
}
