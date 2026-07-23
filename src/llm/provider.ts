import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';

export type SystemConstraints = { systemPrompt: string };
export interface LLMProvider {
  implement(userPrompt: string, constraints: SystemConstraints): Promise<GeneratedCode>;
  grade(code: GeneratedCode, criteria: Criterion[]): Promise<GradeResult>;
  // future: gradeWithScreenshot?(png: Buffer, criteria): Promise<GradeResult>
}
