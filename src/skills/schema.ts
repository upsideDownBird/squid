import { z } from 'zod';

export const SkillYAMLSchema = z.object({
  name: z.string(),
  description: z.string(),
  'when-to-use': z.string(),
  'allowed-tools': z.array(z.string()),
  'argument-hint': z.string().optional(),
  model: z.string().optional(),
  effort: z.enum(['low', 'medium', 'high']),
  'user-invocable': z.boolean(),
  hooks: z.object({
    pre_invoke: z.string().optional(),
    post_invoke: z.string().optional()
  }).optional(),
  examples: z.array(z.string()).optional()
});

export type SkillYAML = z.infer<typeof SkillYAMLSchema>;

export interface SkillDefinition {
  metadata: SkillYAML;
  systemPrompt: string;
}
