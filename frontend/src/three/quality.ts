export type QualityTier = 'high' | 'medium' | 'low';

export interface QualityConfig {
  tier: QualityTier;
  pixelRatioCap: number;
  shadowMapSize: number;
  maxTransmissiveMeshes: number;
  icosphereDetail: number;
  instanceCap: number;
}

const TIER_CONFIGS: Record<QualityTier, QualityConfig> = {
  high: {
    tier: 'high',
    pixelRatioCap: 2,
    shadowMapSize: 2048,
    maxTransmissiveMeshes: 2,
    icosphereDetail: 5,
    instanceCap: 120,
  },
  medium: {
    tier: 'medium',
    pixelRatioCap: 1.5,
    shadowMapSize: 1024,
    maxTransmissiveMeshes: 1,
    icosphereDetail: 4,
    instanceCap: 80,
  },
  low: {
    tier: 'low',
    pixelRatioCap: 1,
    shadowMapSize: 512,
    maxTransmissiveMeshes: 0,
    icosphereDetail: 4,
    instanceCap: 40,
  },
};

export function detectInitialTier(): QualityTier {
  const cores = navigator.hardwareConcurrency || 4;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 500;

  if (smallViewport && cores <= 4) {
    return 'low';
  }
  if (isCoarsePointer || cores <= 4) {
    return 'medium';
  }
  return 'high';
}

export function getQualityConfig(tier: QualityTier): QualityConfig {
  return TIER_CONFIGS[tier];
}

export function stepDownTier(current: QualityTier): QualityTier {
  if (current === 'high') return 'medium';
  return 'low';
}

