import type { ProblemSeed } from './types.ts';
import { buttons } from './data/buttons.ts';
import { forms } from './data/forms.ts';
import { feedback } from './data/feedback.ts';
import { navigation } from './data/navigation.ts';
import { dataDisplay } from './data/data-display.ts';
import { overlays } from './data/overlays.ts';
import { layout } from './data/layout.ts';

// Aggregate of every category (~50 component-scale UI problems).
export const allProblems: ProblemSeed[] = [
  ...buttons,
  ...forms,
  ...feedback,
  ...navigation,
  ...dataDisplay,
  ...overlays,
  ...layout,
];
