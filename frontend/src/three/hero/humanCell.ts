import * as THREE from 'three';
import gsap from 'gsap';
import { createNoise3D } from 'simplex-noise';
import type { Lesson, LessonControl, LessonPart } from '../../api/types';
import { seededRandom } from '../geometry';
import { createPartMaterial } from '../materials';
import type { QualityConfig } from '../quality';
import {
  createCristaeBumpTexture,
  createNuclearPoreTexture,
  createRadialGlowTexture,
} from './textures';
import type { HeroPartRegistration, HeroSceneController } from './types';

function tagPartHierarchy(obj: THREE.Object3D, partId: string): void {
  obj.userData.partId = partId;
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
}

function createDisplacedSphere(
  radius: number,
  detail: number,
  seed: string,
  ampRatio: number,
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const rng = seededRandom(seed);
  const noise3D = createNoise3D(rng);
  const pos = geo.attributes.position;
  if (pos) {
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const dir = v.clone().normalize();
      const n =
        noise3D(dir.x * 1.45, dir.y * 1.45, dir.z * 1.45) * 0.72 +
        noise3D(dir.x * 3.1, dir.y * 3.1, dir.z * 3.1) * 0.28;
      v.addScaledVector(dir, n * radius * ampRatio);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return geo;
}

/**
 * Bespoke museum-grade Human Cell 3D hero builder (F8.2).
 * Consumes Gemini's lesson parts by id while constructing hand-crafted organic organelles.
 */
export function buildHumanCellHero(
  lesson: Lesson,
  quality: QualityConfig,
): HeroSceneController {
  const root = new THREE.Group();
  const interiorGroup = new THREE.Group();
  root.add(interiorGroup);

  const registrations: HeroPartRegistration[] = [];
  const disposableGeos: THREE.BufferGeometry[] = [];
  const disposableMats: THREE.Material[] = [];
  const disposableTexs: THREE.Texture[] = [];

  const cristaeTex = createCristaeBumpTexture();
  const poreTex = createNuclearPoreTexture();
  const glowTex = createRadialGlowTexture('#FFFFFF', '#FFD8BE');
  disposableTexs.push(cristaeTex, poreTex, glowTex);

  const byId = new Map<string, LessonPart>();
  for (const p of lesson.parts) {
    byId.set(p.id, p);
  }

  const noise = createNoise3D(seededRandom('human_cell_motion'));

  // 1. MEMBRANE — translucent phospholipid outer boundary + inner sheen rim
  let membraneMat: THREE.MeshPhysicalMaterial | null = null;
  let membraneGroup: THREE.Group | null = null;
  const membranePart = byId.get('membrane');
  if (membranePart) {
    const group = new THREE.Group();
    const geo = createDisplacedSphere(
      2.65,
      quality.icosphereDetail,
      'cell_membrane',
      0.022,
    );
    disposableGeos.push(geo);

    const allowTrans = quality.maxTransmissiveMeshes > 0;
    const mat = allowTrans
      ? new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#FCEBF4'),
          transmission: 0.92,
          thickness: 1.35,
          ior: 1.34,
          roughness: 0.11,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          attenuationColor: new THREE.Color(membranePart.color || '#F2C6DE'),
          attenuationDistance: 2.8,
          transparent: true,
          opacity: 0.96,
        })
      : new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(membranePart.color || '#F2C6DE'),
          transparent: true,
          opacity: 0.28,
          roughness: 0.15,
          clearcoat: 1.0,
          depthWrite: false,
        });
    disposableMats.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    group.add(mesh);

    // Subtle inner lipid-bilayer contour ring
    const innerRimGeo = new THREE.IcosahedronGeometry(
      2.57,
      Math.max(3, quality.icosphereDetail - 1),
    );
    const innerRimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#E3D8FA'),
      transparent: true,
      opacity: 0.12,
      roughness: 0.3,
      side: THREE.BackSide,
      depthWrite: false,
    });
    disposableGeos.push(innerRimGeo);
    disposableMats.push(innerRimMat);
    const innerRimMesh = new THREE.Mesh(innerRimGeo, innerRimMat);
    group.add(innerRimMesh);

    tagPartHierarchy(group, membranePart.id);
    root.add(group);

    membraneMat = mat;
    membraneGroup = group;
    registrations.push({
      part: membranePart,
      group,
      primaryMesh: mesh,
      material: mat,
      labelOffsetY: 2.75,
    });
  }

  // 2. NUCLEUS — central lavender command sphere with nuclear pores
  const nucleusPart = byId.get('nucleus');
  if (nucleusPart) {
    const group = new THREE.Group();
    group.position.set(-0.22, 0.12, -0.15);

    const geo = createDisplacedSphere(
      0.86,
      quality.icosphereDetail,
      'cell_nucleus',
      0.035,
    );
    disposableGeos.push(geo);

    const col = new THREE.Color(nucleusPart.color || '#B9B2EE');
    const mat = new THREE.MeshPhysicalMaterial({
      color: col,
      roughness: 0.32,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2,
      sheen: 1.0,
      sheenRoughness: 0.45,
      sheenColor: col.clone().lerp(new THREE.Color('#FFFFFF'), 0.35),
      bumpMap: poreTex,
      bumpScale: 0.018,
      emissive: col,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.86,
    });
    disposableMats.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    tagPartHierarchy(group, nucleusPart.id);
    interiorGroup.add(group);
    registrations.push({
      part: nucleusPart,
      group,
      primaryMesh: mesh,
      material: mat,
      labelOffsetY: 0.98,
    });
  }

  // 3. NUCLEOLUS — dense luminous core inside the nucleus
  const nucleolusPart = byId.get('nucleolus');
  if (nucleolusPart) {
    const group = new THREE.Group();
    group.position.set(-0.18, 0.18, -0.05);

    const geo = createDisplacedSphere(0.32, 4, 'cell_nucleolus', 0.04);
    disposableGeos.push(geo);

    const col = new THREE.Color(nucleolusPart.color || '#D6C7FF');
    const mat = new THREE.MeshPhysicalMaterial({
      color: col,
      emissive: new THREE.Color('#B59TF8' in col ? '#C5B4FA' : '#C5B4FA'),
      emissiveIntensity: 0.65,
      roughness: 0.25,
      clearcoat: 0.85,
    });
    disposableMats.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    tagPartHierarchy(group, nucleolusPart.id);
    interiorGroup.add(group);
    registrations.push({
      part: nucleolusPart,
      group,
      primaryMesh: mesh,
      material: mat,
      labelOffsetY: 0.45,
    });
  }

  // 4. MITOCHONDRIA — 6 curved bean capsules with inner folded cristae & ATP glow
  const mitoPart = byId.get('mitochondria');
  const mitoItems: Array<{
    subGroup: THREE.Group;
    basePos: THREE.Vector3;
    baseRot: THREE.Euler;
    phase: number;
  }> = [];
  let mitoOuterMat: THREE.MeshPhysicalMaterial | null = null;
  let mitoInnerMat: THREE.MeshPhysicalMaterial | null = null;

  if (mitoPart) {
    const group = new THREE.Group();
    group.position.set(1.18, -0.18, 0.55);

    const outerGeo = new THREE.CapsuleGeometry(0.19, 0.34, 16, 28);
    const innerGeo = new THREE.CapsuleGeometry(0.13, 0.28, 12, 20);
    disposableGeos.push(outerGeo, innerGeo);

    const col = new THREE.Color(mitoPart.color || '#FFCDB8');
    mitoOuterMat = new THREE.MeshPhysicalMaterial({
      color: col,
      roughness: 0.28,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      sheen: 1.0,
      sheenColor: new THREE.Color('#FFF2EA'),
      bumpMap: cristaeTex,
      bumpScale: 0.028,
      emissive: new THREE.Color('#FFB185'),
      emissiveIntensity: 0.32,
      transparent: true,
      opacity: 0.9,
    });

    mitoInnerMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFE5D4'),
      emissive: new THREE.Color('#FF9E6D'),
      emissiveIntensity: 0.75,
      roughness: 0.35,
      bumpMap: cristaeTex,
      bumpScale: 0.045,
    });
    disposableMats.push(mitoOuterMat, mitoInnerMat);

    const placements: Array<{
      pos: [number, number, number];
      rot: [number, number, number];
    }> = [
      { pos: [0.0, 0.0, 0.0], rot: [0.4, 0.3, -0.5] },
      { pos: [0.35, 0.68, -0.45], rot: [-0.3, 0.8, 0.4] },
      { pos: [-0.45, -0.78, 0.32], rot: [0.6, -0.4, 0.7] },
      { pos: [-2.15, 0.48, -0.35], rot: [-0.5, 0.2, -0.6] },
      { pos: [-1.75, -0.65, 0.65], rot: [0.3, -0.7, 0.25] },
      { pos: [0.22, -0.48, -1.35], rot: [-0.4, 0.5, 0.8] },
    ];

    let primaryMesh: THREE.Mesh | null = null;
    placements.forEach((cfg, idx) => {
      const sub = new THREE.Group();
      sub.position.set(...cfg.pos);
      sub.rotation.set(...cfg.rot);

      const outerMesh = new THREE.Mesh(outerGeo, mitoOuterMat!);
      outerMesh.castShadow = true;
      outerMesh.receiveShadow = true;

      const innerMesh = new THREE.Mesh(innerGeo, mitoInnerMat!);
      sub.add(outerMesh, innerMesh);
      group.add(sub);

      if (idx === 0) primaryMesh = outerMesh;
      mitoItems.push({
        subGroup: sub,
        basePos: new THREE.Vector3(...cfg.pos),
        baseRot: new THREE.Euler(...cfg.rot),
        phase: idx * 1.15,
      });
    });

    tagPartHierarchy(group, mitoPart.id);
    interiorGroup.add(group);
    if (primaryMesh) {
      registrations.push({
        part: mitoPart,
        group,
        primaryMesh,
        material: mitoOuterMat,
        labelOffsetY: 0.52,
      });
    }
  }

  // 5. ROUGH ER — stacked folded cisternae sheets wrapping around the nucleus
  const erPart = byId.get('rough_er');
  const erSurfacePoints: THREE.Vector3[] = [];
  if (erPart) {
    const group = new THREE.Group();
    group.position.set(-0.92, 0.08, 0.38);

    const mat = createPartMaterial(
      'organelle',
      erPart.color || '#B5E8D2',
      false,
    );
    mat.roughness = 0.32;
    mat.clearcoat = 0.68;
    disposableMats.push(mat);

    const sheetArcs: Array<{
      radius: number;
      yOff: number;
      span: [number, number];
      waveAmp: number;
    }> = [
      { radius: 0.96, yOff: 0.32, span: [1.85, 4.35], waveAmp: 0.08 },
      { radius: 1.08, yOff: 0.08, span: [1.65, 4.55], waveAmp: 0.1 },
      { radius: 1.2, yOff: -0.18, span: [1.75, 4.45], waveAmp: 0.09 },
      { radius: 1.32, yOff: -0.42, span: [2.0, 4.2], waveAmp: 0.07 },
      { radius: 1.04, yOff: 0.52, span: [2.1, 4.05], waveAmp: 0.06 },
    ];

    let primaryMesh: THREE.Mesh | null = null;
    sheetArcs.forEach((arc, arcIdx) => {
      const pts: THREE.Vector3[] = [];
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const theta = THREE.MathUtils.lerp(arc.span[0], arc.span[1], u);
        const rWobble =
          arc.radius + Math.sin(u * Math.PI * 3 + arcIdx) * arc.waveAmp;
        const x = Math.cos(theta) * rWobble + 0.68;
        const z = Math.sin(theta) * rWobble - 0.52;
        const y =
          arc.yOff + Math.cos(u * Math.PI * 2 + arcIdx * 0.8) * 0.06;
        const pt = new THREE.Vector3(x, y, z);
        pts.push(pt);
        if (i % 2 === 0) {
          erSurfacePoints.push(
            pt.clone().add(new THREE.Vector3(-0.92, 0.08 + 0.09, 0.38)),
          );
        }
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.085, 14, false);
      disposableGeos.push(tubeGeo);

      const mesh = new THREE.Mesh(tubeGeo, mat);
      mesh.scale.set(1.0, 1.45, 1.0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      if (arcIdx === 1) primaryMesh = mesh;
    });

    tagPartHierarchy(group, erPart.id);
    interiorGroup.add(group);
    if (primaryMesh) {
      registrations.push({
        part: erPart,
        group,
        primaryMesh,
        material: mat,
        labelOffsetY: 0.68,
      });
    }
  }

  // 6. GOLGI APPARATUS — 6 curved, cupped cisternae stacks in butter-yellow
  const golgiPart = byId.get('golgi');
  if (golgiPart) {
    const group = new THREE.Group();
    group.position.set(0.88, 0.68, -0.58);
    group.rotation.set(0.35, -0.48, 0.22);

    const mat = createPartMaterial(
      'organelle',
      golgiPart.color || '#FBE9A8',
      false,
    );
    mat.roughness = 0.3;
    mat.clearcoat = 0.75;
    disposableMats.push(mat);

    let primaryMesh: THREE.Mesh | null = null;
    for (let layer = 0; layer < 6; layer++) {
      const layerSpread = 0.32 + Math.sin((layer / 5) * Math.PI) * 0.22;
      const yOffset = (layer - 2.5) * 0.115;
      const curvePts: THREE.Vector3[] = [];
      for (let j = -4; j <= 4; j++) {
        const t = j / 4;
        const x = t * layerSpread;
        const z = -Math.pow(t, 2) * 0.22;
        curvePts.push(new THREE.Vector3(x, yOffset, z));
      }
      const c = new THREE.CatmullRomCurve3(curvePts);
      const g = new THREE.TubeGeometry(c, 28, 0.052, 12, false);
      disposableGeos.push(g);

      const m = new THREE.Mesh(g, mat);
      m.scale.set(1.0, 0.72, 1.85);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      if (layer === 2) primaryMesh = m;
    }

    tagPartHierarchy(group, golgiPart.id);
    interiorGroup.add(group);
    if (primaryMesh) {
      registrations.push({
        part: golgiPart,
        group,
        primaryMesh,
        material: mat,
        labelOffsetY: 0.56,
      });
    }
  }

  // 7. LYSOSOMES — glossy rose spheres with dense enzymatic core granules
  const lysoPart = byId.get('lysosomes');
  if (lysoPart) {
    const group = new THREE.Group();
    group.position.set(-1.12, -0.68, -0.68);

    const outerGeo = new THREE.IcosahedronGeometry(0.21, 4);
    const coreGeo = new THREE.IcosahedronGeometry(0.11, 3);
    disposableGeos.push(outerGeo, coreGeo);

    const col = new THREE.Color(lysoPart.color || '#F6BFD3');
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: col,
      roughness: 0.18,
      clearcoat: 0.92,
      transparent: true,
      opacity: 0.84,
      emissive: col,
      emissiveIntensity: 0.12,
    });
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: col.clone().offsetHSL(0, 0.12, -0.12),
      emissive: col,
      emissiveIntensity: 0.35,
      roughness: 0.35,
    });
    disposableMats.push(outerMat, coreMat);

    const offsets: Array<[number, number, number, number]> = [
      [0, 0, 0, 1.0],
      [0.48, 0.25, 0.35, 0.85],
      [-0.35, 0.38, -0.25, 0.78],
      [0.85, -0.15, 0.95, 0.92],
      [1.45, 0.92, 0.25, 0.82],
    ];

    let primaryMesh: THREE.Mesh | null = null;
    offsets.forEach(([ox, oy, oz, sc], idx) => {
      const sub = new THREE.Group();
      sub.position.set(ox, oy, oz);
      sub.scale.setScalar(sc);
      const om = new THREE.Mesh(outerGeo, outerMat);
      const cm = new THREE.Mesh(coreGeo, coreMat);
      om.castShadow = true;
      sub.add(om, cm);
      group.add(sub);
      if (idx === 0) primaryMesh = om;
    });

    tagPartHierarchy(group, lysoPart.id);
    interiorGroup.add(group);
    if (primaryMesh) {
      registrations.push({
        part: lysoPart,
        group,
        primaryMesh,
        material: outerMat,
        labelOffsetY: 0.42,
      });
    }
  }

  // 8. RIBOSOMES — 72 instanced micro-spheres (half on Rough ER, half free in cytosol)
  const riboPart = byId.get('ribosomes');
  let riboInst: THREE.InstancedMesh | null = null;
  const riboBasePositions: THREE.Vector3[] = [];
  if (riboPart) {
    const group = new THREE.Group();
    group.position.set(-0.65, 0.32, 0.55);

    const count = Math.min(72, quality.instanceCap);
    const geo = new THREE.IcosahedronGeometry(0.048, 2);
    disposableGeos.push(geo);

    const mat = createPartMaterial(
      'matte',
      riboPart.color || '#B8DCF5',
      false,
    );
    mat.roughness = 0.45;
    mat.clearcoat = 0.5;
    disposableMats.push(mat);

    const inst = new THREE.InstancedMesh(geo, mat, count);
    inst.castShadow = true;
    const rng = seededRandom('cell_ribosomes');
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      let pos: THREE.Vector3;
      if (i < erSurfacePoints.length) {
        pos = erSurfacePoints[i]!
          .clone()
          .sub(group.position)
          .add(
            new THREE.Vector3(
              (rng() - 0.5) * 0.08,
              (rng() - 0.5) * 0.08,
              (rng() - 0.5) * 0.08,
            ),
          );
      } else {
        const theta = rng() * Math.PI * 2;
        const phi = Math.acos(2 * rng() - 1);
        const rad = 0.95 + rng() * 1.15;
        pos = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * rad,
          Math.sin(phi) * Math.sin(theta) * rad,
          Math.cos(phi) * rad,
        ).sub(group.position);
      }
      riboBasePositions.push(pos);
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.85 + rng() * 0.35);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
    riboInst = inst;

    tagPartHierarchy(group, riboPart.id);
    interiorGroup.add(group);
    registrations.push({
      part: riboPart,
      group,
      primaryMesh: inst,
      material: mat,
      labelOffsetY: 0.45,
    });
  }

  // 9. VESICLES — transport bubbles actively flowing along paths between Golgi & Membrane
  const vesiclePart = byId.get('vesicles');
  const vesicleFollowers: Array<{
    mesh: THREE.Mesh;
    curve: THREE.CatmullRomCurve3;
    offset: number;
    speed: number;
  }> = [];
  if (vesiclePart) {
    const group = new THREE.Group();
    group.position.set(1.38, 0.38, 0.12);

    const geo = new THREE.IcosahedronGeometry(0.11, 3);
    disposableGeos.push(geo);

    const mat = createPartMaterial(
      'organelle',
      vesiclePart.color || '#C9E4F8',
      false,
    );
    mat.clearcoat = 0.95;
    mat.roughness = 0.15;
    mat.emissiveIntensity = 0.22;
    disposableMats.push(mat);

    const paths = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, 0.28, -0.65),
        new THREE.Vector3(0.0, 0.12, -0.25),
        new THREE.Vector3(0.55, 0.05, 0.25),
        new THREE.Vector3(0.95, 0.18, 0.68),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.5, 0.32, -0.58),
        new THREE.Vector3(-0.1, 0.45, 0.1),
        new THREE.Vector3(0.38, 0.58, 0.62),
        new THREE.Vector3(0.75, 0.72, 0.95),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.42, 0.18, -0.7),
        new THREE.Vector3(0.15, -0.22, -0.38),
        new THREE.Vector3(0.62, -0.48, -0.05),
        new THREE.Vector3(0.98, -0.62, 0.25),
      ]),
    ];

    let primaryMesh: THREE.Mesh | null = null;
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.scale.setScalar(0.78 + (i % 3) * 0.18);
      m.castShadow = true;
      const curve = paths[i % paths.length]!;
      const offset = (i / 9) % 1;
      m.position.copy(curve.getPointAt(offset));
      group.add(m);
      if (i === 0) primaryMesh = m;
      vesicleFollowers.push({
        mesh: m,
        curve,
        offset,
        speed: 0.12 + (i % 3) * 0.03,
      });
    }

    tagPartHierarchy(group, vesiclePart.id);
    interiorGroup.add(group);
    if (primaryMesh) {
      registrations.push({
        part: vesiclePart,
        group,
        primaryMesh,
        material: mat,
        labelOffsetY: 0.42,
      });
    }
  }

  let energyLevel = 0.6;

  return {
    root,
    registrations,
    cameraPreset: {
      outsidePos: new THREE.Vector3(2.3, 1.75, 6.25),
      outsideTarget: new THREE.Vector3(0, 0.05, 0),
      insidePos: new THREE.Vector3(0.42, 0.32, 1.52),
      insideTarget: new THREE.Vector3(-0.18, 0.1, -0.08),
    },
    update(elapsed: number, _dt: number, reducedMotion: boolean): void {
      if (reducedMotion) {
        const slowBreath = 1 + Math.sin(elapsed * 0.6) * 0.01;
        root.scale.setScalar(slowBreath);
        return;
      }

      // 1. Membrane gentle breathing (±1.5% at ~0.15 Hz — F8.2)
      if (membraneGroup) {
        const breath = 1 + Math.sin(elapsed * Math.PI * 0.3) * 0.015;
        membraneGroup.scale.setScalar(breath);
      }

      // 2. Cytoplasmic streaming — slow interior rotation with simplex wobble (F8.2)
      interiorGroup.rotation.y =
        elapsed * 0.045 + noise(elapsed * 0.12, 0, 0) * 0.06;
      interiorGroup.rotation.x = noise(0, elapsed * 0.1, 0) * 0.04;

      // 3. Mitochondria independent bobbing, rotation & ATP pulse
      const pulseSpeed = 1.2 + energyLevel * 1.8;
      mitoItems.forEach((item, idx) => {
        const t = elapsed * (0.7 + energyLevel * 0.6) + item.phase;
        item.subGroup.position.y =
          item.basePos.y + Math.sin(t * 1.1) * 0.055;
        item.subGroup.rotation.x =
          item.baseRot.x + Math.sin(t * 0.7) * 0.08;
        item.subGroup.rotation.z =
          item.baseRot.z + Math.cos(t * 0.6 + idx) * 0.08;
        const pulse =
          1 + Math.sin(elapsed * pulseSpeed + item.phase) * (0.025 + energyLevel * 0.035);
        item.subGroup.scale.setScalar(pulse);
      });

      // 4. Vesicle transport along curved secretory pathways
      for (const vf of vesicleFollowers) {
        const u = (vf.offset + elapsed * vf.speed) % 1;
        vf.mesh.position.copy(vf.curve.getPointAt(u));
      }

      // 5. Ribosome subtle Brownian drift
      if (riboInst && riboBasePositions.length > 0) {
        const dummy = new THREE.Object3D();
        for (let i = 0; i < riboBasePositions.length; i++) {
          const base = riboBasePositions[i]!;
          const drift = Math.sin(elapsed * 1.4 + i * 0.7) * 0.018;
          dummy.position.set(base.x + drift, base.y - drift, base.z);
          dummy.scale.setScalar(0.92 + (i % 3) * 0.1);
          dummy.updateMatrix();
          riboInst.setMatrixAt(i, dummy.matrix);
        }
        riboInst.instanceMatrix.needsUpdate = true;
      }
    },
    applyControls(
      controls: LessonControl[],
      values: Record<string, number>,
    ): void {
      const energyCtrl = controls.find((c) => c.id === 'energy') ?? controls[0];
      if (!energyCtrl) return;
      const val = values[energyCtrl.id] ?? energyCtrl.default;
      const span = Math.max(0.0001, energyCtrl.max - energyCtrl.min);
      const tNorm = Math.max(0, Math.min(1, (val - energyCtrl.min) / span));
      energyLevel = tNorm;

      if (mitoOuterMat && mitoInnerMat) {
        gsap.to(mitoOuterMat, {
          emissiveIntensity: THREE.MathUtils.lerp(0.08, 1.35, tNorm),
          duration: 0.25,
          ease: 'power2.out',
        });
        gsap.to(mitoInnerMat, {
          emissiveIntensity: THREE.MathUtils.lerp(0.2, 2.2, tNorm),
          duration: 0.25,
          ease: 'power2.out',
        });
      }
    },
    setInsideMode(inside: boolean, reducedMotion: boolean): void {
      if (!membraneMat) return;
      const dur = reducedMotion ? 0.15 : 0.55;
      membraneMat.transparent = true;
      if (inside) {
        gsap.to(membraneMat, {
          opacity: 0.14,
          transmission: membraneMat.transmission > 0 ? 0.22 : 0,
          duration: dur,
          ease: 'power2.out',
        });
      } else {
        gsap.to(membraneMat, {
          opacity: quality.maxTransmissiveMeshes > 0 ? 0.96 : 0.28,
          transmission: quality.maxTransmissiveMeshes > 0 ? 0.92 : 0,
          duration: dur,
          ease: 'power2.out',
        });
      }
    },
    dispose(): void {
      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      disposableTexs.forEach((t) => t.dispose());
    },
  };
}

