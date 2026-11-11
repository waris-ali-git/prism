import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createNoise3D } from 'simplex-noise';
import type { LessonPart } from '../api/types';

function hashSeed(input: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seed: string): () => number {
  return hashSeed(seed);
}

export function createPartGeometry(
  part: LessonPart,
  icosphereDetail: number,
): THREE.BufferGeometry {
  const size = Math.max(0.05, part.size);
  const defaultOrganic =
    part.material === 'membrane' ||
    part.material === 'organelle' ||
    part.material === 'liquid'
      ? 0.12
      : 0;
  const organic = part.organic ?? defaultOrganic;

  switch (part.shape) {
    case 'sphere': {
      const radius = size * 0.5;
      const geo = new THREE.IcosahedronGeometry(
        radius,
        organic > 0 ? icosphereDetail : Math.max(3, icosphereDetail - 1),
      );
      if (organic > 0) {
        const noise3D = createNoise3D(hashSeed(part.id));
        const pos = geo.attributes.position;
        if (pos) {
          const v = new THREE.Vector3();
          const n = new THREE.Vector3();
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            n.copy(v).normalize();
            const low = noise3D(n.x * 1.4, n.y * 1.4, n.z * 1.4);
            const mid = noise3D(n.x * 3.1 + 7.2, n.y * 3.1, n.z * 3.1) * 0.35;
            const disp = 1 + (low + mid) * organic * 0.22;
            v.multiplyScalar(disp);
            pos.setXYZ(i, v.x, v.y, v.z);
          }
          geo.computeVertexNormals();
        }
      }
      return geo;
    }

    case 'capsule': {
      const radius = size * 0.28;
      const length = size * 0.55;
      return new THREE.CapsuleGeometry(radius, length, 12, 24);
    }

    case 'disc': {
      const outerR = size * 0.5;
      const points: THREE.Vector2[] = [];
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const angle = u * Math.PI;
        const r = Math.sin(angle) * outerR;
        const pinch = 1 - 0.45 * Math.pow(Math.cos((r / Math.max(outerR, 0.001)) * (Math.PI / 2)), 2);
        const y = Math.cos(angle) * (size * 0.16) * pinch;
        points.push(new THREE.Vector2(Math.max(0.001, r), y));
      }
      const geo = new THREE.LatheGeometry(points, 36);
      geo.computeVertexNormals();
      return geo;
    }

    case 'tube': {
      const rawPts =
        part.path && part.path.length >= 3
          ? part.path
          : [
              [-size, 0, 0],
              [0, size * 0.4, 0],
              [size, 0, 0],
            ];
      const curve = new THREE.CatmullRomCurve3(
        rawPts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      );
      return new THREE.TubeGeometry(curve, 48, Math.max(0.025, size * 0.5), 16, false);
    }

    case 'torus': {
      const mainR = size * 0.41;
      const tubeR = size * 0.18 * 0.5;
      return new THREE.TorusGeometry(mainR, Math.max(0.02, tubeR), 20, 48);
    }

    case 'box':
    default: {
      return new RoundedBoxGeometry(size, size, size, 4, size * 0.14);
    }
  }
}

