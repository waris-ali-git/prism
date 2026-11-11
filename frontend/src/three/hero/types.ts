import type * as THREE from 'three';
import type { Lesson, LessonControl, LessonPart } from '../../api/types';
import type { QualityConfig } from '../quality';

export interface HeroPartRegistration {
  part: LessonPart;
  group: THREE.Group;
  primaryMesh: THREE.Mesh | THREE.InstancedMesh;
  material: THREE.MeshPhysicalMaterial;
  labelOffsetY?: number;
}

export interface HeroCameraPreset {
  outsidePos: THREE.Vector3;
  outsideTarget: THREE.Vector3;
  insidePos: THREE.Vector3;
  insideTarget: THREE.Vector3;
}

export interface HeroSceneController {
  root: THREE.Group;
  registrations: HeroPartRegistration[];
  cameraPreset: HeroCameraPreset;
  update: (elapsed: number, dt: number, reducedMotion: boolean) => void;
  applyControls: (
    controls: LessonControl[],
    values: Record<string, number>,
  ) => void;
  setInsideMode?: (inside: boolean, reducedMotion: boolean) => void;
  dispose: () => void;
}

export type HeroBuilderFn = (
  lesson: Lesson,
  quality: QualityConfig,
) => HeroSceneController;
