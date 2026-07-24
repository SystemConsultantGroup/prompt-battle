// Shape of a seeded problem. Kept independent of the DB layer so seed data
// files stay pure data. scripts/seed.ts maps these onto createProblem/addCriterion.
export type CriterionSeed = {
  kind: 'basic' | 'detail';
  description: string;
};

export type ProblemSeed = {
  title: string;
  category: string;
  difficulty: 'easy' | 'normal' | 'hard';
  timeLimitSec: number;
  targetHtml: string;
  targetCss: string;
  targetJs: string; // '' for static (HTML/CSS-only) problems
  detailWeight?: number; // default 0.3
  criteria: CriterionSeed[];
};
