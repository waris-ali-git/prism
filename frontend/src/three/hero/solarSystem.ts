import * as THREE from 'three';
import gsap from 'gsap';
import type { Lesson, LessonControl, LessonPart } from '../../api/types';
import { seededRandom } from '../geometry';
import type { QualityConfig } from '../quality';
import {
  createPlanetBandTexture,
  createRadialGlowTexture,
  createSaturnRingTexture,
  createSolarSurfaceTexture,
  createTerrestrialTexture,
} from './textures';
import type { HeroPartRegistration, HeroSceneController } from './types';

function tagPartHierarchy(obj: THREE.Object3D, partId: string): void {
  obj.userData.partId = partId;
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
}

interface OrbitingPlanet {
  id: string;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  orbitRadiusX: number;
  orbitRadiusZ: number;
  inclination: number;
  keplerSpeed: number;
  spinSpeed: number;
  angle: number;
  moonPivot?: THREE.Group;
}

/**
 * Bespoke museum-grade Solar System Orrery 3D hero builder (Section 6.7 & F8).
 * Features a glowing solar photosphere + corona, precision elliptical orbit tracks,
 * procedural planetary textures, Earth's orbiting Moon, 100+ instanced asteroids,
 * and Saturn's concentric ring system synced to Saturn's live Keplerian orbit.
 */
export function buildSolarSystemHero(
  lesson: Lesson,
  quality: QualityConfig,
): HeroSceneController {
  const root = new THREE.Group();
  const registrations: HeroPartRegistration[] = [];
  const disposableGeos: THREE.BufferGeometry[] = [];
  const disposableMats: THREE.Material[] = [];
  const disposableTexs: THREE.Texture[] = [];

  const byId = new Map<string, LessonPart>();
  for (const p of lesson.parts) {
    byId.set(p.id, p);
  }

  const sunTex = createSolarSurfaceTexture();
  const coronaTex = createRadialGlowTexture('#FFFDF2', '#FFE094');
  const mercuryTex = createTerrestrialTexture('mercury');
  const venusTex = createPlanetBandTexture([
    '#FBE5B8',
    '#FFF3D6',
    '#F5D29E',
    '#FCE9C2',
  ]);
  const earthTex = createTerrestrialTexture('earth');
  const marsTex = createTerrestrialTexture('mars');
  const jupiterTex = createPlanetBandTexture(
    [
      '#F5D5C0',
      '#FFF2E6',
      '#F0BFA6',
      '#FCE8D8',
      '#E8B49A',
      '#FFF0E4',
      '#F2CBB4',
    ],
    true,
  );
  const saturnTex = createPlanetBandTexture([
    '#F9E6AC',
    '#FFF6D6',
    '#EDD492',
    '#FBF0C4',
    '#E8CE8E',
  ]);
  const saturnRingTex = createSaturnRingTexture();
  const neptuneTex = createPlanetBandTexture([
    '#9EC2F8',
    '#B8D6FC',
    '#8EB4F2',
    '#C4DDFD',
    '#9BC0F6',
  ]);

  disposableTexs.push(
    sunTex,
    coronaTex,
    mercuryTex,
    venusTex,
    earthTex,
    marsTex,
    jupiterTex,
    saturnTex,
    saturnRingTex,
    neptuneTex,
  );

  // 1. THE SUN — Radiant central star with photosphere, corona halo & point light
  const sunPart = byId.get('sun');
  let sunMesh: THREE.Mesh | null = null;
  let sunShellMesh: THREE.Mesh | null = null;
  if (sunPart) {
    const group = new THREE.Group();
    const sunGeo = new THREE.SphereGeometry(0.76, 48, 48);
    const shellGeo = new THREE.SphereGeometry(0.84, 36, 36);
    disposableGeos.push(sunGeo, shellGeo);

    const sunMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFF6D6'),
      map: sunTex,
      emissive: new THREE.Color('#FFD27D'),
      emissiveMap: sunTex,
      emissiveIntensity: 1.45,
      roughness: 0.2,
    });
    const shellMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFE6A8'),
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const coronaSpriteMat = new THREE.SpriteMaterial({
      map: coronaTex,
      color: new THREE.Color('#FFE4A0'),
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    disposableMats.push(sunMat, shellMat, coronaSpriteMat);

    const mesh = new THREE.Mesh(sunGeo, sunMat);
    const shell = new THREE.Mesh(shellGeo, shellMat);
    const corona = new THREE.Sprite(coronaSpriteMat);
    corona.scale.setScalar(2.65);

    // Warm heliocentric point light illuminating all orbiting planets
    const sunLight = new THREE.PointLight('#FFF3DA', 3.4, 18, 0.85);
    group.add(mesh, shell, corona, sunLight);

    sunMesh = mesh;
    sunShellMesh = shell;

    tagPartHierarchy(group, sunPart.id);
    root.add(group);
    registrations.push({
      part: sunPart,
      group,
      primaryMesh: mesh,
      material: sunMat,
      labelOffsetY: 0.95,
    });
  }

  // Helper to draw delicate frosted elliptical orbital path rings
  function addOrbitTrack(rx: number, rz: number, inc: number): void {
    const pts: THREE.Vector3[] = [];
    const segs = 96;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const x = Math.cos(a) * rx;
      const z = Math.sin(a) * rz;
      const y = Math.sin(a) * rx * Math.sin(inc);
      pts.push(new THREE.Vector3(x, y, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#CFC9EE'),
      transparent: true,
      opacity: 0.48,
    });
    disposableGeos.push(geo);
    disposableMats.push(mat);
    const loop = new THREE.LineLoop(geo, mat);
    root.add(loop);
  }

  // Planet configurations (Keplerian angular speed decreases outward)
  const planetSpecs: Array<{
    id: string;
    radius: number;
    rx: number;
    rz: number;
    inc: number;
    tilt: number;
    keplerSpeed: number;
    spinSpeed: number;
    startAngle: number;
    tex: THREE.Texture;
    tint: string;
    hasMoon?: boolean;
  }> = [
    {
      id: 'mercury',
      radius: 0.13,
      rx: 1.22,
      rz: 1.18,
      inc: 0.04,
      tilt: 0.03,
      keplerSpeed: 1.15,
      spinSpeed: 0.4,
      startAngle: 0.4,
      tex: mercuryTex,
      tint: '#E2DDF0',
    },
    {
      id: 'venus',
      radius: 0.19,
      rx: 1.68,
      rz: 1.66,
      inc: 0.02,
      tilt: 0.05,
      keplerSpeed: 0.84,
      spinSpeed: -0.3,
      startAngle: 1.65,
      tex: venusTex,
      tint: '#FCE6BC',
    },
    {
      id: 'earth',
      radius: 0.22,
      rx: 2.22,
      rz: 2.18,
      inc: 0.0,
      tilt: 0.41, // 23.5 deg
      keplerSpeed: 0.64,
      spinSpeed: 1.2,
      startAngle: 2.85,
      tex: earthTex,
      tint: '#D8EEFC',
      hasMoon: true,
    },
    {
      id: 'mars',
      radius: 0.16,
      rx: 2.75,
      rz: 2.68,
      inc: 0.03,
      tilt: 0.44,
      keplerSpeed: 0.48,
      spinSpeed: 1.1,
      startAngle: 4.1,
      tex: marsTex,
      tint: '#FAD0C2',
    },
    {
      id: 'jupiter',
      radius: 0.42,
      rx: 3.92,
      rz: 3.84,
      inc: 0.02,
      tilt: 0.06,
      keplerSpeed: 0.28,
      spinSpeed: 1.85,
      startAngle: 0.95,
      tex: jupiterTex,
      tint: '#FFE8D8',
    },
    {
      id: 'saturn',
      radius: 0.34,
      rx: 4.68,
      rz: 4.58,
      inc: 0.035,
      tilt: 0.466, // 26.7 deg
      keplerSpeed: 0.2,
      spinSpeed: 1.65,
      startAngle: 3.55,
      tex: saturnTex,
      tint: '#FCF0C2',
    },
    {
      id: 'neptune',
      radius: 0.26,
      rx: 5.3,
      rz: 5.24,
      inc: 0.025,
      tilt: 0.49,
      keplerSpeed: 0.13,
      spinSpeed: 1.4,
      startAngle: 5.2,
      tex: neptuneTex,
      tint: '#C2DCFC',
    },
  ];

  const orbitingPlanets: OrbitingPlanet[] = [];
  let saturnPlanetRef: OrbitingPlanet | null = null;

  for (const cfg of planetSpecs) {
    const part = byId.get(cfg.id);
    if (!part) continue;

    addOrbitTrack(cfg.rx, cfg.rz, cfg.inc);

    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(cfg.radius, 36, 36);
    disposableGeos.push(geo);

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(cfg.tint),
      map: cfg.tex,
      roughness: 0.36,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      sheen: 0.75,
      sheenColor: new THREE.Color('#FFFFFF'),
      emissive: new THREE.Color(cfg.tint),
      emissiveIntensity: 0.08,
    });
    disposableMats.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = cfg.tilt;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    let moonPivot: THREE.Group | undefined;
    if (cfg.hasMoon) {
      moonPivot = new THREE.Group();
      const moonGeo = new THREE.SphereGeometry(0.055, 16, 16);
      const moonMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#EAE6F8'),
        roughness: 0.6,
      });
      disposableGeos.push(moonGeo);
      disposableMats.push(moonMat);
      const moonMesh = new THREE.Mesh(moonGeo, moonMat);
      moonMesh.position.set(0.38, 0.04, 0);
      moonPivot.add(moonMesh);
      group.add(moonPivot);
    }

    const initX = Math.cos(cfg.startAngle) * cfg.rx;
    const initZ = Math.sin(cfg.startAngle) * cfg.rz;
    const initY = Math.sin(cfg.startAngle) * cfg.rx * Math.sin(cfg.inc);
    group.position.set(initX, initY, initZ);

    tagPartHierarchy(group, part.id);
    root.add(group);

    const planetEntry: OrbitingPlanet = {
      id: cfg.id,
      group,
      bodyMesh: mesh,
      orbitRadiusX: cfg.rx,
      orbitRadiusZ: cfg.rz,
      inclination: cfg.inc,
      keplerSpeed: cfg.keplerSpeed,
      spinSpeed: cfg.spinSpeed,
      angle: cfg.startAngle,
      moonPivot,
    };
    orbitingPlanets.push(planetEntry);
    if (cfg.id === 'saturn') saturnPlanetRef = planetEntry;

    registrations.push({
      part,
      group,
      primaryMesh: mesh,
      material: mat,
      labelOffsetY: cfg.radius + 0.24,
    });
  }

  // ASTEROID BELT — 100+ instanced rocky polyhedra orbiting between Mars & Jupiter
  const beltPart = byId.get('asteroid_belt');
  let beltGroup: THREE.Group | null = null;
  if (beltPart) {
    const group = new THREE.Group();
    beltGroup = group;

    const count = Math.min(108, quality.instanceCap);
    const rockGeo = new THREE.DodecahedronGeometry(0.048, 0);
    disposableGeos.push(rockGeo);

    const rockMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(beltPart.color || '#DDD7EE'),
      roughness: 0.68,
      metalness: 0.15,
      clearcoat: 0.25,
    });
    disposableMats.push(rockMat);

    const inst = new THREE.InstancedMesh(rockGeo, rockMat, count);
    const rng = seededRandom('asteroid_belt_torus');
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.12;
      const r = 3.22 + rng() * 0.34;
      const y = (rng() - 0.5) * 0.18;
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.rotation.set(
        rng() * Math.PI,
        rng() * Math.PI,
        rng() * Math.PI,
      );
      dummy.scale.set(
        0.65 + rng() * 0.8,
        0.55 + rng() * 0.7,
        0.65 + rng() * 0.8,
      );
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;

    // Anchor group position on the belt rim so its pill label sits cleanly on the belt
    group.position.set(0, 0, 0);
    group.add(inst);

    tagPartHierarchy(group, beltPart.id);
    root.add(group);
    registrations.push({
      part: beltPart,
      group,
      primaryMesh: inst,
      material: rockMat,
      labelOffsetY: 0.42,
    });
  }

  // SATURN'S RINGS — Concentric Cassini-division ring disc synced to Saturn's live orbit
  const ringsPart = byId.get('saturn_rings');
  let saturnRingsGroup: THREE.Group | null = null;
  if (ringsPart) {
    const group = new THREE.Group();
    saturnRingsGroup = group;

    const ringGeo = new THREE.RingGeometry(0.44, 0.88, 72);
    // Remap UVs so createSaturnRingTexture() radial gradient maps cleanly across the disk
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    if (pos && uv) {
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        uv.setXY(i, vx / 1.76 + 0.5, vy / 1.76 + 0.5);
      }
      uv.needsUpdate = true;
    }
    ringGeo.rotateX(Math.PI / 2);
    disposableGeos.push(ringGeo);

    const ringMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFF8E8'),
      map: saturnRingTex,
      transparent: true,
      opacity: 0.92,
      roughness: 0.35,
      clearcoat: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    disposableMats.push(ringMat);

    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.z = 0.466; // Match Saturn's 26.7° axial tilt
    ringMesh.rotation.x = 0.14;
    group.add(ringMesh);

    if (saturnPlanetRef) {
      group.position.copy(saturnPlanetRef.group.position);
    } else {
      group.position.set(4.68, 0, 0);
    }

    tagPartHierarchy(group, ringsPart.id);
    root.add(group);
    registrations.push({
      part: ringsPart,
      group,
      primaryMesh: ringMesh,
      material: ringMat,
      labelOffsetY: 0.52,
    });
  }

  const speedState = { mult: 1.0 };

  return {
    root,
    registrations,
    cameraPreset: {
      outsidePos: new THREE.Vector3(0.0, 3.85, 9.2),
      outsideTarget: new THREE.Vector3(0, -0.1, 0),
      insidePos: new THREE.Vector3(0.65, 1.45, 3.85),
      insideTarget: new THREE.Vector3(0, 0, 0),
    },
    update(elapsed: number, dt: number, reducedMotion: boolean): void {
      if (reducedMotion) return;

      // 1. Sun axial spin & photosphere shimmer
      if (sunMesh && sunShellMesh) {
        sunMesh.rotation.y = elapsed * 0.18;
        sunShellMesh.rotation.y = -elapsed * 0.12;
        const pulse = 1 + Math.sin(elapsed * 2.1) * 0.015;
        sunShellMesh.scale.setScalar(pulse);
      }

      // 2. Keplerian planetary orbits & axial rotation
      const step = dt * 0.55 * speedState.mult;
      for (const p of orbitingPlanets) {
        p.angle += step * p.keplerSpeed;
        const x = Math.cos(p.angle) * p.orbitRadiusX;
        const z = Math.sin(p.angle) * p.orbitRadiusZ;
        const y = Math.sin(p.angle) * p.orbitRadiusX * Math.sin(p.inclination);
        p.group.position.set(x, y, z);
        p.bodyMesh.rotation.y += dt * p.spinSpeed;

        if (p.moonPivot) {
          p.moonPivot.rotation.y = elapsed * 1.8 * speedState.mult;
        }
      }

      // 3. Keep Saturn's rings locked to Saturn's exact world position
      if (saturnRingsGroup && saturnPlanetRef) {
        saturnRingsGroup.position.copy(saturnPlanetRef.group.position);
      }

      // 4. Asteroid belt revolution
      if (beltGroup) {
        beltGroup.rotation.y += step * 0.34;
      }
    },
    applyControls(
      controls: LessonControl[],
      values: Record<string, number>,
    ): void {
      const speedCtrl =
        controls.find((c) => c.id === 'orbital_speed') ?? controls[0];
      if (!speedCtrl) return;
      const val = values[speedCtrl.id] ?? speedCtrl.default;
      const span = Math.max(0.0001, speedCtrl.max - speedCtrl.min);
      const tNorm = Math.max(0, Math.min(1, (val - speedCtrl.min) / span));
      const targetMult = THREE.MathUtils.lerp(0.18, 2.35, tNorm);

      gsap.to(speedState, {
        mult: targetMult,
        duration: 0.25,
        ease: 'power2.out',
      });
    },
    dispose(): void {
      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      disposableTexs.forEach((t) => t.dispose());
    },
  };
}
