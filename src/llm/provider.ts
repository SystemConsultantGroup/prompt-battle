import type { GeneratedCode, GradeResult } from '../game/types.ts';
import type { Criterion } from '../db/index.ts';

export type SystemConstraints = { systemPrompt: string };
export interface LLMProvider {
  implement(userPrompt: string, constraints: SystemConstraints): Promise<GeneratedCode>;
  /** `reference` is the target UI the players were shown (trusted, admin
   *  authored); the rubric compares exact values against it. */
  grade(code: GeneratedCode, criteria: Criterion[], reference?: GeneratedCode): Promise<GradeResult>;
  // future: gradeWithScreenshot?(png: Buffer, criteria): Promise<GradeResult>
}
