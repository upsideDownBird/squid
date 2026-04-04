import type { MCPServerConfig } from './client';

export const builtInConnectors: MCPServerConfig[] = [
  {
    name: 'github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || ''
    }
  },
  {
    name: 'slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
      SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || ''
    }
  },
  {
    name: 'notion',
    command: 'npx',
    args: ['-y', '@notionhq/mcp-server-notion'],
    env: {
      NOTION_API_KEY: process.env.NOTION_API_KEY || ''
    }
  },
  {
    name: 'jira',
    command: 'npx',
    args: ['-y', 'mcp-server-jira'],
    env: {
      JIRA_URL: process.env.JIRA_URL || '',
      JIRA_EMAIL: process.env.JIRA_EMAIL || '',
      JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || ''
    }
  }
];
