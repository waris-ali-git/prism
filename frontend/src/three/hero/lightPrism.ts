import * as THREE from 'three';
import gsap from 'gsap';
import type { Lesson, LessonControl, LessonPart } from '../../api/types';
import type { QualityConfig } from '../quality';
import {
  createRadialGlowTexture,
  createSpectrumGradientTexture,
} from './textures';
import type { HeroPartRegistration, HeroSceneController } from './types';

function tagPartHierarchy(obj: THREE.Object3D, partId: string): void {
  obj.userData.partId = partId;
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
}

interface SpectralRayVisual {
  partId?: string;
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  spotSprite: THREE.Sprite;
  exitY: number;
  baseEndY: number;
  color: string;
}

/**
 * Bespoke museum-grade Optical Prism Dispersion 3D hero builder (Section 6.7 & F8).
 * Features a beveled equilateral crown-glass prism, collimated white incident beam,
 * volumetric internal refraction wedge, ROYGBIV dispersed spectrum rays, and a live
 * caustic projection screen driven smoothly by the `dispersion` slider.
 */
export function buildLightPrismHero(
  lesson: Lesson,
  quality: QualityConfig,
): HeroSceneController {
  const root = new THREE.Group();
  const registrations: HeroPartRegistration[] = [];
  const disposableGeos: THREE.BufferGeometry[] = [];
  const disposableMats: THREE.Material[] = [];
  const disposableTexs: THREE.Texture[] = [];

  const spectrumTex = createSpectrumGradientTexture();
  const glowTex = createRadialGlowTexture('#FFFFFF', '#E8E2FF');
  disposableTexs.push(spectrumTex, glowTex);

  const byId = new Map<string, LessonPart>();
  for (const p of lesson.parts) {
    byId.set(p.id, p);
  }

  // 1. GLASS PRISM — Precision beveled equilateral optical crystal + architectural mount
  const prismPart = byId.get('glass_prism');
  let prismMesh: THREE.Mesh | null = null;
  if (prismPart) {
    const group = new THREE.Group();
    group.position.set(0, 0.08, 0);

    const tri = new THREE.Shape();
    const r = 1.38;
    // Vertices: Top (0, r), Bottom-Left (-r*cos30, -r*sin30), Bottom-Right (r*cos30, -r*sin30)
    tri.moveTo(0, r * 0.95);
    tri.lineTo(-r * 0.92, -r * 0.65);
    tri.lineTo(r * 0.92, -r * 0.65);
    tri.closePath();

    const prismGeo = new THREE.ExtrudeGeometry(tri, {
      depth: 1.95,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
    prismGeo.center();
    disposableGeos.push(prismGeo);

    const allowTrans = quality.maxTransmissiveMeshes > 0;
    const prismMat = allowTrans
      ? new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#FFFFFF'),
          transmission: 1.0,
          thickness: 1.85,
          ior: 1.54,
          roughness: 0.025,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          iridescence: 0.88,
          iridescenceIOR: 1.38,
          attenuationColor: new THREE.Color('#EAE4FD'),
          attenuationDistance: 3.2,
        })
      : new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#F2EEFC'),
          transparent: true,
          opacity: 0.48,
          roughness: 0.05,
          clearcoat: 1.0,
          iridescence: 0.75,
        });
    disposableMats.push(prismMat);

    const mesh = new THREE.Mesh(prismGeo, prismMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    prismMesh = mesh;

    // Sleek museum pedestal base under the prism
    const pedGeo = new THREE.CylinderGeometry(1.18, 1.32, 0.14, 48);
    const pedMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#EDEBF8'),
      metalness: 0.35,
      roughness: 0.25,
      clearcoat: 0.6,
    });
    disposableGeos.push(pedGeo);
    disposableMats.push(pedMat);
    const pedMesh = new THREE.Mesh(pedGeo, pedMat);
    pedMesh.position.set(0, -1.04, 0);
    pedMesh.receiveShadow = true;
    pedMesh.castShadow = true;
    group.add(pedMesh);

    tagPartHierarchy(group, prismPart.id);
    root.add(group);
    registrations.push({
      part: prismPart,
      group,
      primaryMesh: mesh,
      material: prismMat,
      labelOffsetY: 1.52,
    });
  }

  // 2. INCIDENT BEAM — Coherent white light beam + optical emitter housing + photon pulses
  const incidentPart = byId.get('incident_beam');
  const photonPulses: Array<{ mesh: THREE.Mesh; curve: THREE.LineCurve3; phase: number }> = [];
  if (incidentPart) {
    const group = new THREE.Group();

    const startPt = new THREE.Vector3(-4.15, -0.52, 0);
    const entryPt = new THREE.Vector3(-0.62, 0.12, 0);
    const beamCurve = new THREE.LineCurve3(startPt, entryPt);

    const coreGeo = new THREE.TubeGeometry(beamCurve, 24, 0.055, 16, false);
    const haloGeo = new THREE.TubeGeometry(beamCurve, 24, 0.135, 16, false);
    disposableGeos.push(coreGeo, haloGeo);

    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFFFFF'),
      emissive: new THREE.Color('#FFFDF6'),
      emissiveIntensity: 1.45,
      roughness: 0.1,
    });
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#EAE4FF'),
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    disposableMats.push(coreMat, haloMat);

    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    group.add(coreMesh, haloMesh);

    // Optical collimator emitter cylinder on the left
    const emitterGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.65, 32);
    emitterGeo.rotateZ(-Math.PI / 2 + 0.18);
    const emitterMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#DCD7F4'),
      metalness: 0.65,
      roughness: 0.25,
      clearcoat: 0.7,
    });
    disposableGeos.push(emitterGeo);
    disposableMats.push(emitterMat);
    const emitterMesh = new THREE.Mesh(emitterGeo, emitterMat);
    emitterMesh.position.copy(startPt);
    emitterMesh.castShadow = true;
    group.add(emitterMesh);

    // Incidence glow hotspot on the left face of the prism
    const entrySpriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: new THREE.Color('#FFFFFF'),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    disposableMats.push(entrySpriteMat);
    const entrySprite = new THREE.Sprite(entrySpriteMat);
    entrySprite.position.copy(entryPt);
    entrySprite.scale.setScalar(0.55);
    group.add(entrySprite);

    // Animated wave photon packets along incident beam
    const pulseGeo = new THREE.SphereGeometry(0.075, 12, 12);
    disposableGeos.push(pulseGeo);
    for (let i = 0; i < 3; i++) {
      const pm = new THREE.Mesh(pulseGeo, coreMat);
      group.add(pm);
      photonPulses.push({ mesh: pm, curve: beamCurve, phase: i / 3 });
    }

    tagPartHierarchy(group, incidentPart.id);
    root.add(group);
    registrations.push({
      part: incidentPart,
      group,
      primaryMesh: coreMesh,
      material: coreMat,
      labelOffsetY: 0.45,
    });
  }

  // 3. REFRACTED BEAM — Internal wavelength separation fan inside the crystal
  const refractedPart = byId.get('refracted_beam');
  let internalFanGroup: THREE.Group | null = null;
  if (refractedPart) {
    const group = new THREE.Group();
    internalFanGroup = group;

    const internalCurve = new THREE.LineCurve3(
      new THREE.Vector3(-0.62, 0.12, 0),
      new THREE.Vector3(0.62, 0.04, 0),
    );
    const coreGeo = new THREE.TubeGeometry(internalCurve, 20, 0.085, 16, false);
    const fanGeo = new THREE.PlaneGeometry(1.26, 0.42);
    disposableGeos.push(coreGeo, fanGeo);

    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F3EEFF'),
      emissive: new THREE.Color('#DFD5FF'),
      emissiveIntensity: 1.15,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
    });
    const fanMat = new THREE.MeshBasicMaterial({
      map: spectrumTex,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    disposableMats.push(coreMat, fanMat);

    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    const fanPlane = new THREE.Mesh(fanGeo, fanMat);
    fanPlane.position.set(0.0, 0.08, 0.0);
    fanPlane.rotation.z = -0.06;
    group.add(coreMesh, fanPlane);

    tagPartHierarchy(group, refractedPart.id);
    root.add(group);
    registrations.push({
      part: refractedPart,
      group,
      primaryMesh: coreMesh,
      material: coreMat,
      labelOffsetY: 0.62,
    });
  }

  // 4, 5, 6. SPECTRUM RAYS (red_ray, green_ray, violet_ray + continuous intermediate spectral bands)
  const screenX = 3.52;
  const spectralDefs: Array<{
    partId?: string;
    color: string;
    emissive: string;
    exitY: number;
    baseEndY: number;
    radius: number;
    labelY: number;
  }> = [
    {
      partId: 'red_ray',
      color: '#FFB4B8',
      emissive: '#FF8A92',
      exitY: 0.18,
      baseEndY: 0.62,
      radius: 0.052,
      labelY: 0.58,
    },
    {
      color: '#FFD0AD',
      emissive: '#FFB984',
      exitY: 0.13,
      baseEndY: 0.36,
      radius: 0.032,
      labelY: 0,
    },
    {
      color: '#FCEAA6',
      emissive: '#F9DC78',
      exitY: 0.08,
      baseEndY: 0.12,
      radius: 0.032,
      labelY: 0,
    },
    {
      partId: 'green_ray',
      color: '#AEEAD0',
      emissive: '#7ADBB2',
      exitY: 0.03,
      baseEndY: -0.14,
      radius: 0.052,
      labelY: 0.25,
    },
    {
      color: '#AED8FA',
      emissive: '#7CC0F6',
      exitY: -0.03,
      baseEndY: -0.44,
      radius: 0.032,
      labelY: 0,
    },
    {
      partId: 'violet_ray',
      color: '#C6B4F8',
      emissive: '#A58BF4',
      exitY: -0.09,
      baseEndY: -0.78,
      radius: 0.052,
      labelY: -0.42,
    },
  ];

  // Construct cylindrical beam along unit X so we can dynamically orient & scale it from exitPt to screenPt
  const unitCylCore = new THREE.CylinderGeometry(1, 1, 1, 16);
  unitCylCore.rotateZ(-Math.PI / 2);
  unitCylCore.translate(0.5, 0, 0);
  disposableGeos.push(unitCylCore);

  const spectralVisuals: SpectralRayVisual[] = [];

  for (const def of spectralDefs) {
    const group = new THREE.Group();
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(def.color),
      emissive: new THREE.Color(def.emissive),
      emissiveIntensity: def.partId ? 1.25 : 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: def.partId ? 0.96 : 0.68,
    });
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(def.color),
      transparent: true,
      opacity: def.partId ? 0.28 : 0.16,
      depthWrite: false,
    });
    const spotMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: new THREE.Color(def.emissive),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    disposableMats.push(coreMat, haloMat, spotMat);

    const coreMesh = new THREE.Mesh(unitCylCore, coreMat);
    const haloMesh = new THREE.Mesh(unitCylCore, haloMat);
    const spotSprite = new THREE.Sprite(spotMat);
    spotSprite.scale.setScalar(def.partId ? 0.48 : 0.34);

    group.add(coreMesh, haloMesh, spotSprite);
    root.add(group);

    if (def.partId) {
      const part = byId.get(def.partId);
      if (part) {
        tagPartHierarchy(group, part.id);
        registrations.push({
          part,
          group,
          primaryMesh: coreMesh,
          material: coreMat,
          labelOffsetY: def.labelY,
        });
      }
    }

    spectralVisuals.push({
      partId: def.partId,
      group,
      coreMesh,
      haloMesh,
      spotSprite,
      exitY: def.exitY,
      baseEndY: def.baseEndY,
      color: def.color,
    });
  }

  // 7. PROJECTION SCREEN — Curved museum optical screen + live rainbow caustic band
  const screenPart = byId.get('projection_screen');
  let screenSpectrumBand: THREE.Mesh | null = null;
  if (screenPart) {
    const group = new THREE.Group();
    group.position.set(screenX + 0.12, -0.08, 0);

    const boardGeo = new THREE.BoxGeometry(0.16, 2.55, 1.75);
    const bandGeo = new THREE.PlaneGeometry(1.15, 1.85);
    disposableGeos.push(boardGeo, bandGeo);

    const boardMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F5F3FC'),
      roughness: 0.42,
      clearcoat: 0.45,
      sheen: 0.8,
      sheenColor: new THREE.Color('#FFFFFF'),
    });
    const bandMat = new THREE.MeshBasicMaterial({
      map: spectrumTex,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    disposableMats.push(boardMat, bandMat);

    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.castShadow = true;
    boardMesh.receiveShadow = true;

    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.position.set(-0.09, 0.0, 0.0);
    bandMesh.rotation.y = -Math.PI / 2;
    screenSpectrumBand = bandMesh;

    group.add(boardMesh, bandMesh);
    tagPartHierarchy(group, screenPart.id);
    root.add(group);

    registrations.push({
      part: screenPart,
      group,
      primaryMesh: boardMesh,
      material: boardMat,
      labelOffsetY: 1.42,
    });
  }

  const state = { spreadFactor: 1.0 };

  function updateRayGeometry(spreadFactor: number): void {
    const exitX = 0.62;
    const centerEndY = -0.08;

    for (const ray of spectralVisuals) {
      const start = new THREE.Vector3(exitX, ray.exitY, 0);
      const endY =
        centerEndY + (ray.baseEndY - centerEndY) * spreadFactor;
      const end = new THREE.Vector3(screenX, endY, 0);

      const delta = end.clone().sub(start);
      const len = delta.length();
      const angleZ = Math.atan2(delta.y, delta.x);

      ray.coreMesh.position.copy(start);
      ray.coreMesh.rotation.z = angleZ;
      const rCore = ray.partId ? 0.052 : 0.032;
      ray.coreMesh.scale.set(len, rCore, rCore);

      ray.haloMesh.position.copy(start);
      ray.haloMesh.rotation.z = angleZ;
      const rHalo = rCore * 2.4;
      ray.haloMesh.scale.set(len, rHalo, rHalo);

      ray.spotSprite.position.set(screenX - 0.02, endY, 0);
    }

    if (screenSpectrumBand) {
      screenSpectrumBand.scale.y = Math.max(0.45, spreadFactor * 0.95);
    }
    if (internalFanGroup) {
      internalFanGroup.scale.y = 0.75 + spreadFactor * 0.25;
    }
  }

  updateRayGeometry(1.0);

  return {
    root,
    registrations,
    cameraPreset: {
      outsidePos: new THREE.Vector3(0.15, 1.45, 7.25),
      outsideTarget: new THREE.Vector3(0.15, -0.05, 0),
      insidePos: new THREE.Vector3(0.15, 0.32, 2.55),
      insideTarget: new THREE.Vector3(0.35, 0.02, 0),
    },
    update(elapsed: number, _dt: number, reducedMotion: boolean): void {
      if (reducedMotion) return;

      // Subtle crystal breathing shimmer
      if (prismMesh) {
        prismMesh.position.y = Math.sin(elapsed * 0.9) * 0.025;
      }

      // Animate travelling photon wave packets along the incident beam
      for (const p of photonPulses) {
        const u = (p.phase + elapsed * 0.55) % 1;
        p.mesh.position.copy(p.curve.getPointAt(u));
      }
    },
    applyControls(
      controls: LessonControl[],
      values: Record<string, number>,
    ): void {
      const dispCtrl =
        controls.find((c) => c.id === 'dispersion') ?? controls[0];
      if (!dispCtrl) return;
      const val = values[dispCtrl.id] ?? dispCtrl.default;
      const span = Math.max(0.0001, dispCtrl.max - dispCtrl.min);
      const tNorm = Math.max(0, Math.min(1, (val - dispCtrl.min) / span));
      const targetSpread = THREE.MathUtils.lerp(0.42, 1.48, tNorm);

      gsap.to(state, {
        spreadFactor: targetSpread,
        duration: 0.25,
        ease: 'power2.out',
        onUpdate: () => {
          updateRayGeometry(state.spreadFactor);
        },
      });
    },
    dispose(): void {
      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      disposableTexs.forEach((t) => t.dispose());
    },
  };
}

