export interface Skill {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  allowedTools: string[];
  argumentHint?: string;
  model?: string;
  effort: 'low' | 'medium' | 'high';
  userInvocable: boolean;
  hooks?: {
    preInvoke?: string;
    postInvoke?: string;
  };
  systemPrompt: string;
}

export interface SkillDefinition {
  frontmatter: Omit<Skill, 'id' | 'systemPrompt'>;
  content: string;
}
