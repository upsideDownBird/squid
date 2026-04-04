// AI prompts for memory extraction

export const EXTRACTION_PROMPT_TEMPLATE = `你是一个记忆提取助手。分析以下对话，识别值得保存为长期记忆的内容。

## 对话历史
{conversation}

## 已有记忆摘要
{existingMemories}

## 提取规则

请识别以下类型的内容：
1. **user** - 用户偏好、角色、技能、习惯、个人信息
   - 关键词：我是、我喜欢、我擅长、我的、我会、我负责
2. **feedback** - 用户反馈、建议、要避免的事项、最佳实践
   - 关键词：应该、不要、避免、记住、建议、最好
3. **project** - 项目信息、需求、决策、功能、任务
   - 关键词：项目、功能、需求、任务、开发、实现
4. **reference** - 技术知识、文档、参考资料、通用信息
   - 关键词：技术、文档、如何、什么是

## 输出格式

返回 JSON 数组，每个记忆包含：
\`\`\`json
[
  {
    "type": "user|feedback|project|reference",
    "name": "简短名称（<50字符）",
    "description": "一句话描述（<100字符）",
    "content": "详细内容",
    "confidence": 0.0-1.0
  }
]
\`\`\`

## 要求

- 只返回高置信度（>0.7）的记忆
- 最多返回 5 个记忆
- 避免与已有记忆重复
- 名称要简洁明了
- 内容要完整准确
- 如果没有值得记住的内容，返回空数组 []

请直接返回 JSON 数组，不要添加其他文字。`;

export function buildExtractionPrompt(
  conversation: string,
  existingMemories: string
): string {
  return EXTRACTION_PROMPT_TEMPLATE
    .replace('{conversation}', conversation)
    .replace('{existingMemories}', existingMemories);
}
