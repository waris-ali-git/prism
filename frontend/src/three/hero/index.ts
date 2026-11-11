import type { Lesson } from '../../api/types';
import type { QualityConfig } from '../quality';
import { buildHumanCellHero } from './humanCell';
import { buildLightPrismHero } from './lightPrism';
import { buildSolarSystemHero } from './solarSystem';
import type { HeroBuilderFn, HeroSceneController } from './types';

const HERO_BUILDERS: Record<string, HeroBuilderFn> = {
  'human-cell': buildHumanCellHero,
  'light-prism': buildLightPrismHero,
  'solar-system': buildSolarSystemHero,
};

export function isHeroTopicKey(topicKey: string): boolean {
  return topicKey in HERO_BUILDERS;
}

export function buildHeroSceneIfMatch(
  lesson: Lesson,
  quality: QualityConfig,
): HeroSceneController | null {
  const builder = HERO_BUILDERS[lesson.topicKey];
  if (!builder) return null;
  return builder(lesson, quality);
}

export type { HeroSceneController, HeroPartRegistration } from './types';

