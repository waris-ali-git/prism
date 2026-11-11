import * as THREE from 'three';
import type { PartMaterial } from '../api/types';

export function createPartMaterial(
  preset: PartMaterial,
  hexColor: string,
  allowTransmission: boolean,
): THREE.MeshPhysicalMaterial {
  const color = new THREE.Color(hexColor);
  const lightened = color.clone().lerp(new THREE.Color('#FFFFFF'), 0.28);

  switch (preset) {
    case 'membrane':
      if (allowTransmission) {
        return new THREE.MeshPhysicalMaterial({
          color: '#FFFFFF',
          transmission: 0.92,
          thickness: 1.2,
          ior: 1.33,
          roughness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          attenuationColor: color,
          attenuationDistance: 2.5,
        });
      }
      return new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.34,
        roughness: 0.14,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        depthWrite: false,
      });

    case 'glass':
      if (allowTransmission) {
        return new THREE.MeshPhysicalMaterial({
          color: '#FFFFFF',
          transmission: 1,
          thickness: 0.7,
          ior: 1.5,
          roughness: 0.04,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          iridescence: 0.38,
          iridescenceIOR: 1.32,
          attenuationColor: color,
          attenuationDistance: 2.2,
        });
      }
      return new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.44,
        roughness: 0.06,
        clearcoat: 1,
        iridescence: 0.32,
        depthWrite: false,
      });

    case 'liquid':
      if (allowTransmission) {
        return new THREE.MeshPhysicalMaterial({
          color: '#FFFFFF',
          transmission: 0.96,
          thickness: 1.5,
          ior: 1.33,
          roughness: 0.03,
          clearcoat: 0.9,
          attenuationColor: color,
          attenuationDistance: 1.6,
        });
      }
      return new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.62,
        roughness: 0.08,
        clearcoat: 0.9,
      });

    case 'organelle':
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.36,
        clearcoat: 0.58,
        clearcoatRoughness: 0.24,
        sheen: 1,
        sheenRoughness: 0.48,
        sheenColor: lightened,
        emissive: color,
        emissiveIntensity: 0.06,
      });

    case 'metal':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.85,
        roughness: 0.26,
        clearcoat: 0.42,
      });

    case 'emissive':
      return new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.15,
        roughness: 0.45,
        clearcoat: 0.3,
      });

    case 'matte':
    default:
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.76,
        clearcoat: 0.14,
        sheen: 0.6,
        sheenColor: lightened,
      });
  }
}

