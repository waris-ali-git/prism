import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { createNoise3D } from 'simplex-noise';
import type {
  Language,
  Lesson,
  LessonControl,
  LessonPart,
} from '../api/types';
import { PASTEL_PALETTE } from '../app/constants';
import { t } from '../app/i18n';
import { createPartGeometry, seededRandom } from './geometry';
import {
  buildHeroSceneIfMatch,
  type HeroSceneController,
} from './hero';
import { createPartMaterial } from './materials';
import {
  detectInitialTier,
  getQualityConfig,
  stepDownTier,
  type QualityConfig,
  type QualityTier,
} from './quality';

interface AmbientOrb {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  orbitRadius: number;
  orbitPhase: number;
  orbitY: number;
  speed: number;
}

interface PartHandle {
  part: LessonPart;
  group: THREE.Group;
  mesh: THREE.Mesh | THREE.InstancedMesh;
  material: THREE.MeshPhysicalMaterial;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  baseStretch: THREE.Vector3;
  baseEmissiveIntensity: number;
  baseOpacity: number;
  instanceOffsets?: THREE.Vector3[];
  instanceRotations?: THREE.Euler[];
  instanceScales?: number[];
  speedMult: number;
  ampMult: number;
  spreadMult: number;
  scaleMult: number;
  labelOffsetY?: number;
  labelEl: HTMLButtonElement;
}

export interface StageCallbacks {
  onSelectPart: (partId: string | null) => void;
}

export class CrystalStage {
  private container: HTMLElement;
  private labelLayer: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private pmrem: THREE.PMREMGenerator;
  private keyLight: THREE.DirectionalLight;
  private ground: THREE.Mesh;

  private tier: QualityTier;
  private quality: QualityConfig;
  private reducedMotion: boolean;

  private ambientGroup = new THREE.Group();
  private crystalMesh: THREE.Mesh | null = null;
  private innerFacetMesh: THREE.Mesh | null = null;
  private ambientOrbs: AmbientOrb[] = [];

  private lessonGroup = new THREE.Group();
  private activeHero: HeroSceneController | null = null;
  private selectionRing: THREE.Mesh;
  private partHandles = new Map<string, PartHandle>();
  private currentLesson: Lesson | null = null;
  private selectedPartId: string | null = null;
  private lang: Language = 'en';

  private mode: 'ambient' | 'loading' | 'lesson' = 'ambient';
  private modeBlend = { loading: 0 };
  private scrollProgress = 0;
  private pointerTarget = { x: 0, y: 0 };
  private pointerSmoothed = { x: 0, y: 0 };

  private defaultCamPos = new THREE.Vector3(0, 1.1, 7.6);
  private defaultCamTarget = new THREE.Vector3(0, 0.15, 0);
  private lastInteractionAt = 0;

  private raycaster = new THREE.Raycaster();
  private pointerDownPos = { x: 0, y: 0 };
  private noise = createNoise3D();
  private callbacks: StageCallbacks;

  private rafId = 0;
  private clock = new THREE.Clock();
  private slowFrameTimer = 0;
  private resizeObserver: ResizeObserver;
  private disposed = false;

  constructor(
    container: HTMLElement,
    labelLayer: HTMLElement,
    callbacks: StageCallbacks,
  ) {
    this.container = container;
    this.labelLayer = labelLayer;
    this.callbacks = callbacks;

    this.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    this.tier = detectInitialTier();
    this.quality = getQualityConfig(this.tier);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.quality.pixelRatioCap),
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'block w-full h-full touch-none select-none';
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D crystal stage',
    );
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    this.camera.position.copy(this.defaultCamPos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.enabled = false;
    this.controls.target.copy(this.defaultCamTarget);

    this.controls.addEventListener('start', () => {
      this.lastInteractionAt = performance.now();
    });
    this.controls.addEventListener('change', () => {
      this.lastInteractionAt = performance.now();
    });

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.92;

    // Museum studio lighting — Section 10.2
    this.keyLight = new THREE.DirectionalLight('#FFF6EE', 2.2);
    this.keyLight.position.set(-4.5, 7.5, 5.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(
      this.quality.shadowMapSize,
      this.quality.shadowMapSize,
    );
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 25;
    const d = 6.5;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.radius = 4;
    this.scene.add(this.keyLight);

    const fillLight = new THREE.HemisphereLight('#FFFFFF', '#E9E6FA', 0.85);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#B8DCF5', 0.9);
    rimLight.position.set(5.2, 3.2, -5.0);
    this.scene.add(rimLight);

    // Soft lavender-tinted contact shadow plane on pure white — Section 10.2
    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.ShadowMaterial({
      color: new THREE.Color('#6E64C4'),
      opacity: 0.09,
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -2.35;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Selection ring for lesson parts — F5
    const ringGeo = new THREE.RingGeometry(0.62, 0.72, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#8F86D6',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    this.scene.add(this.ambientGroup);
    this.scene.add(this.lessonGroup);

    this.buildAmbientCrystalCluster();
    this.bindEvents();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
    this.handleResize();

    this.startLoop();
  }

  private buildAmbientCrystalCluster(): void {
    // Beveled optical triangular glass crystal prism
    const triShape = new THREE.Shape();
    const r = 1.18;
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 + Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) triShape.moveTo(x, y);
      else triShape.lineTo(x, y);
    }
    triShape.closePath();

    const prismGeo = new THREE.ExtrudeGeometry(triShape, {
      depth: 2.05,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.11,
      bevelThickness: 0.11,
    });
    prismGeo.center();

    const allowTrans = this.quality.maxTransmissiveMeshes > 0;
    const crystalMat = allowTrans
      ? new THREE.MeshPhysicalMaterial({
          color: '#FFFFFF',
          transmission: 1.0,
          thickness: 1.65,
          ior: 1.52,
          roughness: 0.03,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          iridescence: 0.68,
          iridescenceIOR: 1.34,
          attenuationColor: new THREE.Color('#EAE6FD'),
          attenuationDistance: 3.4,
        })
      : new THREE.MeshPhysicalMaterial({
          color: '#F2F0FC',
          transparent: true,
          opacity: 0.52,
          roughness: 0.06,
          clearcoat: 1.0,
          iridescence: 0.6,
        });

    this.crystalMesh = new THREE.Mesh(prismGeo, crystalMat);
    this.crystalMesh.position.set(0, 0.35, 0);
    this.crystalMesh.rotation.set(0.32, 0.58, -0.18);
    this.crystalMesh.castShadow = true;
    this.ambientGroup.add(this.crystalMesh);

    // Subtle inner luminous core diamond inside the crystal
    const innerGeo = new THREE.OctahedronGeometry(0.42, 0);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      emissive: new THREE.Color('#D8D3F8'),
      emissiveIntensity: 0.45,
      roughness: 0.15,
      clearcoat: 1,
      transparent: true,
      opacity: 0.72,
    });
    this.innerFacetMesh = new THREE.Mesh(innerGeo, innerMat);
    this.innerFacetMesh.position.copy(this.crystalMesh.position);
    this.ambientGroup.add(this.innerFacetMesh);

    // Pastel spectrum orbs orbiting & refracting behind and around the crystal — Section 9.1 & 9.4
    const orbConfigs: Array<{
      hex: string;
      pos: [number, number, number];
      radius: number;
      orbitR: number;
      phase: number;
      speed: number;
    }> = [
      {
        hex: PASTEL_PALETTE.lavender,
        pos: [-2.45, 1.15, -1.1],
        radius: 0.46,
        orbitR: 1.85,
        phase: 0.0,
        speed: 0.75,
      },
      {
        hex: PASTEL_PALETTE.sky,
        pos: [2.55, 0.95, -0.95],
        radius: 0.4,
        orbitR: 1.95,
        phase: 1.05,
        speed: 0.82,
      },
      {
        hex: PASTEL_PALETTE.mint,
        pos: [-1.85, -0.85, -0.6],
        radius: 0.34,
        orbitR: 1.65,
        phase: 2.1,
        speed: 0.9,
      },
      {
        hex: PASTEL_PALETTE.peach,
        pos: [2.05, -0.72, -0.75],
        radius: 0.44,
        orbitR: 1.75,
        phase: 3.15,
        speed: 0.78,
      },
      {
        hex: PASTEL_PALETTE.rose,
        pos: [-0.55, 1.72, -1.55],
        radius: 0.3,
        orbitR: 1.45,
        phase: 4.2,
        speed: 0.88,
      },
      {
        hex: PASTEL_PALETTE.butter,
        pos: [0.85, -1.25, -1.3],
        radius: 0.28,
        orbitR: 1.5,
        phase: 5.25,
        speed: 0.94,
      },
    ];

    for (const cfg of orbConfigs) {
      const geo = new THREE.IcosahedronGeometry(cfg.radius, 4);
      const col = new THREE.Color(cfg.hex);
      const sheenCol = col.clone().lerp(new THREE.Color('#FFFFFF'), 0.35);
      const mat = new THREE.MeshPhysicalMaterial({
        color: col,
        roughness: 0.22,
        clearcoat: 0.88,
        clearcoatRoughness: 0.14,
        sheen: 1,
        sheenRoughness: 0.4,
        sheenColor: sheenCol,
        emissive: col,
        emissiveIntensity: 0.08,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.castShadow = true;
      this.ambientGroup.add(mesh);

      this.ambientOrbs.push({
        mesh,
        basePos: new THREE.Vector3(...cfg.pos),
        orbitRadius: cfg.orbitR,
        orbitPhase: cfg.phase,
        orbitY: cfg.pos[1] * 0.45,
        speed: cfg.speed,
      });
    }
  }

  private bindEvents(): void {
    window.addEventListener('pointermove', this.onWindowPointerMove, {
      passive: true,
    });
    this.renderer.domElement.addEventListener(
      'pointerdown',
      this.onCanvasPointerDown,
    );
    this.renderer.domElement.addEventListener(
      'pointerup',
      this.onCanvasPointerUp,
    );
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onWindowPointerMove = (e: PointerEvent): void => {
    const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    this.pointerTarget.x = nx;
    this.pointerTarget.y = ny;

    if (this.mode === 'lesson' && e.pointerType === 'mouse') {
      const partId = this.pickPartAtClientXY(e.clientX, e.clientY);
      this.renderer.domElement.style.cursor = partId ? 'pointer' : 'grab';
    }
  };

  private onCanvasPointerDown = (e: PointerEvent): void => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private pickPartAtClientXY(
    clientX: number,
    clientY: number,
  ): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    const hits = this.raycaster.intersectObjects(
      this.lessonGroup.children,
      true,
    );
    for (const hit of hits) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        const pid = curr.userData?.partId as string | undefined;
        if (pid && this.partHandles.has(pid)) {
          return pid;
        }
        curr = curr.parent;
      }
    }
    return null;
  }

  private onCanvasPointerUp = (e: PointerEvent): void => {
    if (this.mode !== 'lesson') return;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 6) return;

    const partId = this.pickPartAtClientXY(e.clientX, e.clientY);
    this.callbacks.onSelectPart(partId);
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.clock.stop();
    } else {
      this.clock.start();
    }
  };

  setMode(nextMode: 'ambient' | 'loading' | 'lesson'): void {
    this.mode = nextMode;

    if (nextMode === 'ambient') {
      this.controls.enabled = false;
      this.ambientGroup.visible = true;
      this.lessonGroup.visible = false;
      this.selectionRing.visible = false;
      this.labelLayer.style.display = 'none';
      gsap.to(this.modeBlend, {
        loading: 0,
        duration: this.reducedMotion ? 0.12 : 0.7,
        ease: 'power2.out',
      });
      gsap.to(this.camera.position, {
        x: 0,
        y: 1.1,
        z: 7.6,
        duration: this.reducedMotion ? 0.12 : 0.8,
        ease: 'power3.out',
      });
    } else if (nextMode === 'loading') {
      this.controls.enabled = false;
      this.ambientGroup.visible = true;
      this.lessonGroup.visible = false;
      this.selectionRing.visible = false;
      this.labelLayer.style.display = 'none';
      gsap.to(this.modeBlend, {
        loading: 1,
        duration: this.reducedMotion ? 0.12 : 0.85,
        ease: 'power2.inOut',
      });
      gsap.to(this.camera.position, {
        x: 0,
        y: 0.75,
        z: 6.4,
        duration: this.reducedMotion ? 0.12 : 0.9,
        ease: 'power3.out',
      });
    } else {
      this.controls.enabled = true;
      this.ambientGroup.visible = false;
      this.lessonGroup.visible = true;
      this.labelLayer.style.display = 'block';
    }
  }

  setScrollProgress(progress: number): void {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
  }

  setLanguage(lang: Language): void {
    this.lang = lang;
    for (const handle of this.partHandles.values()) {
      handle.labelEl.textContent = t(handle.part.name, lang);
      handle.labelEl.setAttribute('lang', lang);
      handle.labelEl.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
      handle.labelEl.classList.toggle('urdu-inline', lang === 'ur');
    }
    this.updateCanvasAriaLabel();
  }

  private updateCanvasAriaLabel(): void {
    if (!this.currentLesson) {
      this.renderer.domElement.setAttribute(
        'aria-label',
        'Interactive 3D crystal stage',
      );
      return;
    }
    const title = t(this.currentLesson.title, this.lang);
    const summary = t(this.currentLesson.summary, this.lang);
    this.renderer.domElement.setAttribute('aria-label', `${title}. ${summary}`);
  }

  private createPillLabelButton(
    part: LessonPart,
    lang: Language,
    index: number,
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stage-pill-label';
    if (lang === 'ur') btn.classList.add('urdu-inline');
    btn.textContent = t(part.name, lang);
    btn.setAttribute('lang', lang);
    btn.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    btn.style.opacity = '0';
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      this.callbacks.onSelectPart(part.id);
    });
    this.labelLayer.appendChild(btn);

    if (this.reducedMotion) {
      gsap.to(btn, { opacity: 1, duration: 0.15 });
    } else {
      gsap.to(btn, {
        opacity: 1,
        duration: 0.36,
        delay: 0.25 + index * 0.085,
        ease: 'power2.out',
      });
    }
    return btn;
  }

  loadLesson(lesson: Lesson, lang: Language): void {
    this.disposeLessonObjects();
    this.currentLesson = lesson;
    this.lang = lang;
    this.selectedPartId = null;

    const hero = buildHeroSceneIfMatch(lesson, this.quality);
    if (hero) {
      this.activeHero = hero;
      this.lessonGroup.add(hero.root);

      hero.registrations.forEach((reg, index) => {
        const btn = this.createPillLabelButton(reg.part, lang, index);

        if (!this.reducedMotion) {
          reg.group.scale.setScalar(0.001);
          gsap.to(reg.group.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.65,
            delay: index * 0.06,
            ease: 'back.out(1.4)',
          });
        }

        this.partHandles.set(reg.part.id, {
          part: reg.part,
          group: reg.group,
          mesh: reg.primaryMesh,
          material: reg.material,
          basePosition: reg.group.position.clone(),
          baseRotation: reg.group.rotation.clone(),
          baseStretch: new THREE.Vector3(1, 1, 1),
          baseEmissiveIntensity: reg.material.emissiveIntensity,
          baseOpacity: reg.material.opacity,
          speedMult: 1,
          ampMult: 1,
          spreadMult: 1,
          scaleMult: 1,
          labelOffsetY: reg.labelOffsetY,
          labelEl: btn,
        });
      });

      this.ground.position.y = -2.45;
      this.defaultCamPos.copy(hero.cameraPreset.outsidePos);
      this.defaultCamTarget.copy(hero.cameraPreset.outsideTarget);
      this.controls.minDistance = 1.6;
      this.controls.maxDistance = 15.5;

      const defaultValues: Record<string, number> = {};
      for (const ctrl of lesson.controls) {
        defaultValues[ctrl.id] = ctrl.default;
      }
      this.applyControls(lesson.controls, defaultValues);

      this.setMode('lesson');
      this.resetView(true);
      this.updateCanvasAriaLabel();
      return;
    }

    let transmissiveCount = 0;

    lesson.parts.forEach((part, index) => {
      const wantsTransmission =
        part.material === 'membrane' ||
        part.material === 'glass' ||
        part.material === 'liquid';
      const allowTransmission =
        wantsTransmission &&
        transmissiveCount < this.quality.maxTransmissiveMeshes;
      if (allowTransmission) transmissiveCount += 1;

      const geo = createPartGeometry(part, this.quality.icosphereDetail);
      const mat = createPartMaterial(
        part.material,
        part.color,
        allowTransmission,
      );

      const group = new THREE.Group();
      const basePos = new THREE.Vector3(...part.position);
      const rot = part.rotation ?? [0, 0, 0];
      const baseRot = new THREE.Euler(rot[0], rot[1], rot[2]);
      const str = part.stretch ?? [1, 1, 1];
      const baseStretch = new THREE.Vector3(str[0], str[1], str[2]);

      group.position.copy(basePos);
      group.rotation.copy(baseRot);

      const rawCount = Math.max(1, Math.round(part.count ?? 1));
      const count = Math.min(rawCount, this.quality.instanceCap);

      let mesh: THREE.Mesh | THREE.InstancedMesh;
      let instanceOffsets: THREE.Vector3[] | undefined;
      let instanceRotations: THREE.Euler[] | undefined;
      let instanceScales: number[] | undefined;

      if (count > 1) {
        const inst = new THREE.InstancedMesh(geo, mat, count);
        inst.userData.partId = part.id;
        inst.castShadow = part.material !== 'membrane';
        inst.receiveShadow = true;

        const rng = seededRandom(`${part.id}_scatter`);
        const spread = Math.max(0.15, part.spread ?? 1.2);
        instanceOffsets = [];
        instanceRotations = [];
        instanceScales = [];

        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
          const u = rng();
          const v = rng();
          const theta = u * 2 * Math.PI;
          const phi = Math.acos(2 * v - 1);
          const rad = Math.cbrt(rng()) * spread;
          const offset = new THREE.Vector3(
            rad * Math.sin(phi) * Math.cos(theta),
            rad * Math.sin(phi) * Math.sin(theta),
            rad * Math.cos(phi),
          );
          const eul = new THREE.Euler(
            rng() * Math.PI,
            rng() * Math.PI,
            rng() * Math.PI,
          );
          const sc = 0.8 + rng() * 0.4;

          instanceOffsets.push(offset);
          instanceRotations.push(eul);
          instanceScales.push(sc);

          dummy.position.copy(offset);
          dummy.rotation.copy(eul);
          dummy.scale.copy(baseStretch).multiplyScalar(sc);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
        mesh = inst;
      } else {
        const single = new THREE.Mesh(geo, mat);
        single.scale.copy(baseStretch);
        single.userData.partId = part.id;
        single.castShadow = part.material !== 'membrane';
        single.receiveShadow = true;
        mesh = single;
      }

      group.add(mesh);
      this.lessonGroup.add(group);

      const btn = this.createPillLabelButton(part, lang, index);

      // Single memorable staggered entrance — F11
      if (this.reducedMotion) {
        group.scale.setScalar(1);
      } else {
        group.scale.setScalar(0.001);
        gsap.to(group.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.62,
          delay: index * 0.06,
          ease: 'back.out(1.4)',
        });
      }

      this.partHandles.set(part.id, {
        part,
        group,
        mesh,
        material: mat,
        basePosition: basePos,
        baseRotation: baseRot,
        baseStretch,
        baseEmissiveIntensity: mat.emissiveIntensity,
        baseOpacity: mat.opacity,
        instanceOffsets,
        instanceRotations,
        instanceScales,
        speedMult: 1,
        ampMult: 1,
        spreadMult: 1,
        scaleMult: 1,
        labelEl: btn,
      });
    });

    // Auto-frame lesson bounding sphere — F4
    const box = new THREE.Box3().setFromObject(this.lessonGroup);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const radius = Math.max(1.6, Math.min(6.5, sphere.radius || 3.2));
    const center = Number.isFinite(sphere.center.x)
      ? sphere.center
      : new THREE.Vector3(0, 0, 0);

    this.ground.position.y = Math.min(-1.8, box.min.y - 0.55);

    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const dist = (radius / Math.sin(fovRad / 2)) * 1.18;

    this.defaultCamTarget.copy(center);
    if (lesson.camera) {
      this.defaultCamPos.set(...lesson.camera.position);
      this.defaultCamTarget.set(...lesson.camera.target);
    } else {
      this.defaultCamPos.set(
        center.x + dist * 0.34,
        center.y + dist * 0.26,
        center.z + dist * 0.92,
      );
    }

    this.controls.minDistance = radius * 0.55;
    this.controls.maxDistance = radius * 3.8;

    const defaultValues: Record<string, number> = {};
    for (const ctrl of lesson.controls) {
      defaultValues[ctrl.id] = ctrl.default;
    }
    this.applyControls(lesson.controls, defaultValues);

    this.setMode('lesson');
    this.resetView(true);
    this.updateCanvasAriaLabel();
  }

  selectPart(partId: string | null): void {
    this.selectedPartId = partId;

    for (const [id, handle] of this.partHandles.entries()) {
      const isSelected = id === partId;
      handle.labelEl.classList.toggle('is-selected', isSelected);
      const targetEmissive = isSelected
        ? Math.max(0.35, handle.baseEmissiveIntensity + 0.28)
        : handle.baseEmissiveIntensity;
      gsap.to(handle.material, {
        emissiveIntensity: targetEmissive,
        duration: 0.28,
        ease: 'power2.out',
      });
    }

    if (!partId) {
      this.selectionRing.visible = false;
      return;
    }

    const handle = this.partHandles.get(partId);
    if (!handle) return;

    const pBox = new THREE.Box3().setFromObject(handle.group);
    const pSphere = new THREE.Sphere();
    pBox.getBoundingSphere(pSphere);
    const r = Math.max(0.45, pSphere.radius);

    this.selectionRing.position.set(
      pSphere.center.x,
      Math.max(this.ground.position.y + 0.02, pBox.min.y - 0.08),
      pSphere.center.z,
    );
    this.selectionRing.scale.setScalar(r * 1.35);
    this.selectionRing.visible = true;

    const viewDir = this.camera.position
      .clone()
      .sub(this.controls.target)
      .normalize();
    if (viewDir.lengthSq() < 0.01) viewDir.set(0.3, 0.25, 0.92).normalize();

    const flyDist = Math.max(this.controls.minDistance * 1.1, r * 3.1);
    const nextPos = pSphere.center.clone().addScaledVector(viewDir, flyDist);

    const dur = this.reducedMotion ? 0.15 : 0.95;
    gsap.to(this.camera.position, {
      x: nextPos.x,
      y: nextPos.y,
      z: nextPos.z,
      duration: dur,
      ease: 'power3.inOut',
    });
    gsap.to(this.controls.target, {
      x: pSphere.center.x,
      y: pSphere.center.y,
      z: pSphere.center.z,
      duration: dur,
      ease: 'power3.inOut',
    });
  }

  resetView(immediate = false): void {
    this.restoreMembraneVisibility();
    const dur = immediate ? 0.01 : this.reducedMotion ? 0.15 : 0.95;
    gsap.to(this.camera.position, {
      x: this.defaultCamPos.x,
      y: this.defaultCamPos.y,
      z: this.defaultCamPos.z,
      duration: dur,
      ease: 'power3.inOut',
    });
    gsap.to(this.controls.target, {
      x: this.defaultCamTarget.x,
      y: this.defaultCamTarget.y,
      z: this.defaultCamTarget.z,
      duration: dur,
      ease: 'power3.inOut',
    });
  }

  setInsideCell(inside: boolean): void {
    if (this.activeHero) {
      this.activeHero.setInsideMode?.(inside, this.reducedMotion);
      if (!inside) {
        this.resetView();
        return;
      }
      const preset = this.activeHero.cameraPreset;
      const dur = this.reducedMotion ? 0.15 : 1.05;
      gsap.to(this.camera.position, {
        x: preset.insidePos.x,
        y: preset.insidePos.y,
        z: preset.insidePos.z,
        duration: dur,
        ease: 'power3.inOut',
      });
      gsap.to(this.controls.target, {
        x: preset.insideTarget.x,
        y: preset.insideTarget.y,
        z: preset.insideTarget.z,
        duration: dur,
        ease: 'power3.inOut',
      });
      return;
    }

    if (!inside) {
      this.resetView();
      return;
    }

    const membrane = this.partHandles.get('membrane');
    if (membrane) {
      membrane.material.transparent = true;
      gsap.to(membrane.material, {
        opacity: 0.15,
        transmission: membrane.material.transmission > 0 ? 0.25 : 0,
        duration: 0.55,
        ease: 'power2.out',
      });
    }

    const dur = this.reducedMotion ? 0.15 : 1.05;
    gsap.to(this.camera.position, {
      x: 0.45,
      y: 0.35,
      z: 1.65,
      duration: dur,
      ease: 'power3.inOut',
    });
    gsap.to(this.controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: dur,
      ease: 'power3.inOut',
    });
  }

  private restoreMembraneVisibility(): void {
    if (this.activeHero) {
      this.activeHero.setInsideMode?.(false, this.reducedMotion);
      return;
    }
    const membrane = this.partHandles.get('membrane');
    if (!membrane) return;
    gsap.to(membrane.material, {
      opacity: membrane.baseOpacity,
      transmission:
        this.quality.maxTransmissiveMeshes > 0 &&
        membrane.part.material === 'membrane'
          ? 0.92
          : 0,
      duration: 0.45,
      ease: 'power2.out',
    });
  }

  applyControls(
    controls: LessonControl[],
    values: Record<string, number>,
  ): void {
    if (this.activeHero) {
      this.activeHero.applyControls(controls, values);
      return;
    }
    // Reset target accumulators per part before applying active sliders
    const nextScale = new Map<string, number>();
    const nextSpeed = new Map<string, number>();
    const nextGlow = new Map<string, number>();
    const nextSpread = new Map<string, number>();
    const nextAmp = new Map<string, number>();
    const nextOpacity = new Map<string, number>();

    for (const ctrl of controls) {
      const val = values[ctrl.id] ?? ctrl.default;
      const span = Math.max(0.0001, ctrl.max - ctrl.min);
      const tNorm = Math.max(0, Math.min(1, (val - ctrl.min) / span));

      for (const pid of ctrl.affects) {
        switch (ctrl.effect) {
          case 'scale':
            nextScale.set(pid, THREE.MathUtils.lerp(0.6, 1.5, tNorm));
            break;
          case 'speed':
            nextSpeed.set(pid, THREE.MathUtils.lerp(0.2, 2.2, tNorm));
            break;
          case 'glow':
            nextGlow.set(pid, THREE.MathUtils.lerp(0.0, 2.2, tNorm));
            break;
          case 'spread':
            nextSpread.set(pid, THREE.MathUtils.lerp(0.5, 1.6, tNorm));
            break;
          case 'amplitude':
            nextAmp.set(pid, THREE.MathUtils.lerp(0.2, 2.0, tNorm));
            break;
          case 'opacity':
            nextOpacity.set(pid, THREE.MathUtils.lerp(0.25, 1.0, tNorm));
            break;
        }
      }
    }

    for (const [id, handle] of this.partHandles.entries()) {
      const targetScale = nextScale.get(id) ?? 1;
      const targetSpeed = nextSpeed.get(id) ?? 1;
      const targetAmp = nextAmp.get(id) ?? 1;
      const targetSpread = nextSpread.get(id) ?? 1;

      gsap.to(handle, {
        scaleMult: targetScale,
        speedMult: targetSpeed,
        ampMult: targetAmp,
        spreadMult: targetSpread,
        duration: 0.25,
        ease: 'power2.out',
        onUpdate: () => {
          if (
            handle.mesh instanceof THREE.InstancedMesh &&
            handle.instanceOffsets &&
            handle.instanceRotations &&
            handle.instanceScales
          ) {
            const dummy = new THREE.Object3D();
            for (let i = 0; i < handle.instanceOffsets.length; i++) {
              const off = handle.instanceOffsets[i];
              const rot = handle.instanceRotations[i];
              const sc = handle.instanceScales[i] ?? 1;
              if (!off || !rot) continue;
              dummy.position.copy(off).multiplyScalar(handle.spreadMult);
              dummy.rotation.copy(rot);
              dummy.scale
                .copy(handle.baseStretch)
                .multiplyScalar(sc * handle.scaleMult);
              dummy.updateMatrix();
              handle.mesh.setMatrixAt(i, dummy.matrix);
            }
            handle.mesh.instanceMatrix.needsUpdate = true;
          } else {
            handle.mesh.scale
              .copy(handle.baseStretch)
              .multiplyScalar(handle.scaleMult);
            if (nextSpread.has(id)) {
              handle.group.position
                .copy(handle.basePosition)
                .multiplyScalar(handle.spreadMult);
            }
          }
        },
      });

      if (nextGlow.has(id)) {
        const g = nextGlow.get(id) ?? handle.baseEmissiveIntensity;
        handle.baseEmissiveIntensity = g;
        gsap.to(handle.material, {
          emissiveIntensity: g,
          duration: 0.25,
          ease: 'power2.out',
        });
      }

      if (nextOpacity.has(id)) {
        const op = nextOpacity.get(id) ?? handle.baseOpacity;
        handle.material.transparent = op < 0.99 || handle.material.transparent;
        gsap.to(handle.material, {
          opacity: op,
          duration: 0.25,
          ease: 'power2.out',
        });
      }
    }
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      this.rafId = window.requestAnimationFrame(tick);
      if (document.hidden) return;

      const dt = Math.min(0.1, this.clock.getDelta());
      const elapsed = this.clock.elapsedTime;

      // Auto-downgrade performance monitor — Section 10.5
      if (dt > 0.022 && this.tier !== 'low') {
        this.slowFrameTimer += dt;
        if (this.slowFrameTimer > 2.0) {
          this.tier = stepDownTier(this.tier);
          this.quality = getQualityConfig(this.tier);
          this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, this.quality.pixelRatioCap),
          );
          this.slowFrameTimer = 0;
        }
      } else {
        this.slowFrameTimer = Math.max(0, this.slowFrameTimer - dt * 0.5);
      }

      if (this.mode === 'ambient' || this.mode === 'loading') {
        this.updateAmbientScene(elapsed, dt);
      } else {
        this.updateLessonScene(elapsed, dt);
      }

      this.renderer.render(this.scene, this.camera);
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  private updateAmbientScene(elapsed: number, dt: number): void {
    const lerpRate = Math.min(1, dt * 4.5);
    this.pointerSmoothed.x +=
      (this.pointerTarget.x - this.pointerSmoothed.x) * lerpRate;
    this.pointerSmoothed.y +=
      (this.pointerTarget.y - this.pointerSmoothed.y) * lerpRate;

    const loadMix = this.modeBlend.loading;
    const scrollRot = this.scrollProgress * Math.PI * 0.85;
    const scrollLift = this.scrollProgress * 0.9;

    if (this.crystalMesh && this.innerFacetMesh) {
      if (this.reducedMotion) {
        const breath = 1 + Math.sin(elapsed * 0.6) * 0.01;
        this.crystalMesh.scale.setScalar(breath);
      } else {
        const spinSpeed = THREE.MathUtils.lerp(0.18, 0.72, loadMix);
        this.crystalMesh.rotation.y =
          0.58 + elapsed * spinSpeed + scrollRot + this.pointerSmoothed.x * 0.28;
        this.crystalMesh.rotation.x =
          0.32 +
          Math.sin(elapsed * 0.45) * 0.09 -
          this.pointerSmoothed.y * 0.18 +
          this.scrollProgress * 0.35;
        this.crystalMesh.position.y =
          0.35 + Math.sin(elapsed * 0.7) * 0.09 + scrollLift * 0.35;

        this.innerFacetMesh.position.copy(this.crystalMesh.position);
        this.innerFacetMesh.rotation.y = -elapsed * (spinSpeed * 1.4);
        this.innerFacetMesh.rotation.z = elapsed * 0.35;
      }
    }

    for (let i = 0; i < this.ambientOrbs.length; i++) {
      const orb = this.ambientOrbs[i];
      if (!orb) continue;

      if (this.reducedMotion) {
        orb.mesh.position.copy(orb.basePos);
        continue;
      }

      // Idle gentle drift position with scroll parallax
      const nx = this.noise(elapsed * 0.22 + i * 3.1, 0, 0) * 0.24;
      const ny = this.noise(0, elapsed * 0.24 + i * 3.1, 0) * 0.22;
      const nz = this.noise(0, 0, elapsed * 0.2 + i * 3.1) * 0.18;

      const scrollSpread = 1 + this.scrollProgress * 0.28;
      const idleX =
        orb.basePos.x * scrollSpread + nx + this.pointerSmoothed.x * 0.18;
      const idleY =
        orb.basePos.y +
        ny -
        this.pointerSmoothed.y * 0.14 +
        this.scrollProgress * (i % 2 === 0 ? 0.45 : -0.25);
      const idleZ = orb.basePos.z + nz;

      // Loading converging orbital dance position — F11
      const angle = orb.orbitPhase + elapsed * (0.95 * orb.speed);
      const convR = orb.orbitRadius * 0.78;
      const loadX = Math.cos(angle) * convR;
      const loadZ = Math.sin(angle) * convR;
      const loadY =
        0.32 + orb.orbitY * 0.55 + Math.sin(elapsed * 1.5 + orb.orbitPhase) * 0.22;

      orb.mesh.position.set(
        THREE.MathUtils.lerp(idleX, loadX, loadMix),
        THREE.MathUtils.lerp(idleY, loadY, loadMix),
        THREE.MathUtils.lerp(idleZ, loadZ, loadMix),
      );
    }

    this.camera.lookAt(0, 0.2 + scrollLift * 0.18, 0);
  }

  private updateLessonScene(elapsed: number, dt: number): void {
    // Gentle idle auto-rotate after 4s of stillness — F5
    const idleMs = performance.now() - this.lastInteractionAt;
    if (!this.reducedMotion && idleMs > 4000 && !this.selectedPartId) {
      this.lessonGroup.rotation.y += dt * 0.085;
    }

    if (this.activeHero) {
      this.activeHero.update(elapsed, dt, this.reducedMotion);

      // Keep selection ring & camera target tracking moving/orbiting hero parts
      if (this.selectedPartId) {
        const selHandle = this.partHandles.get(this.selectedPartId);
        if (selHandle) {
          const wp = new THREE.Vector3();
          selHandle.group.getWorldPosition(wp);
          this.selectionRing.position.x = wp.x;
          this.selectionRing.position.z = wp.z;
          this.controls.target.lerp(wp, Math.min(1, dt * 4.5));
        }
      }

      this.controls.update();
      this.projectLabels();
      return;
    }

    // Organic motion library per part — F8.1
    let idx = 0;
    for (const handle of this.partHandles.values()) {
      idx += 1;
      const m = handle.part.motion;
      const type = m?.type ?? 'drift';
      const speed = (m?.speed ?? 0.8) * handle.speedMult;
      const amp = (m?.amplitude ?? 0.3) * handle.ampMult;

      if (this.reducedMotion) {
        const breath = 1 + Math.sin(elapsed * 0.5 + idx) * 0.01;
        handle.group.scale.setScalar(breath);
        continue;
      }

      const tVal = elapsed * speed;

      switch (type) {
        case 'pulse': {
          const cycle = (tVal * 0.55) % 1;
          const asym =
            cycle < 0.28
              ? Math.sin((cycle / 0.28) * (Math.PI / 2))
              : Math.cos(((cycle - 0.28) / 0.72) * (Math.PI / 2));
          const s = 1 + asym * 0.06 * amp;
          handle.group.scale.setScalar(s);
          break;
        }
        case 'spin': {
          const wobble = 1 + Math.sin(tVal * 0.7) * 0.12;
          handle.group.rotation.y =
            handle.baseRotation.y + tVal * 0.55 * wobble;
          break;
        }
        case 'orbit': {
          const piv = m?.pivot ?? [0, 0, 0];
          const pivotVec = new THREE.Vector3(...piv);
          const rel = handle.basePosition.clone().sub(pivotVec);
          const radius = Math.max(0.2, Math.hypot(rel.x, rel.z));
          const baseAngle = Math.atan2(rel.z, rel.x);
          const ang = baseAngle + tVal * 0.45;
          handle.group.position.set(
            pivotVec.x + Math.cos(ang) * radius,
            handle.basePosition.y + Math.sin(tVal * 0.8) * 0.05 * amp,
            pivotVec.z + Math.sin(ang) * (radius * 0.92),
          );
          break;
        }
        case 'swing': {
          const angle = Math.sin(tVal * 1.4) * (0.28 * amp);
          handle.group.rotation.z = handle.baseRotation.z + angle;
          break;
        }
        case 'bob': {
          const yOff =
            Math.sin(tVal * 1.3 + idx) * 0.09 * amp +
            this.noise(idx * 2.1, tVal * 0.4, 0) * 0.03 * amp;
          handle.group.position.y = handle.basePosition.y + yOff;
          break;
        }
        case 'none':
          break;
        case 'flow':
        case 'drift':
        default: {
          const dAmp = 0.05 * Math.max(0.25, amp);
          const dx =
            (Math.sin(tVal * 0.83 + idx) +
              Math.sin(tVal * 1.37 + idx * 1.7) * 0.5 +
              this.noise(tVal * 0.3, idx * 4.1, 0)) *
            dAmp;
          const dy =
            (Math.sin(tVal * 0.97 + idx * 2.3) +
              this.noise(0, tVal * 0.3, idx * 4.1)) *
            dAmp;
          const dz =
            Math.cos(tVal * 0.71 + idx * 1.3) * dAmp * 0.8;
          handle.group.position.set(
            handle.basePosition.x + dx,
            handle.basePosition.y + dy,
            handle.basePosition.z + dz,
          );
          break;
        }
      }
    }

    this.controls.update();
    this.projectLabels();
  }

  private projectLabels(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const placedRects: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    // Prioritize selected part label first so it never hides on overlap — F5
    const ordered = Array.from(this.partHandles.values()).sort((a, b) => {
      if (a.part.id === this.selectedPartId) return -1;
      if (b.part.id === this.selectedPartId) return 1;
      return b.part.size - a.part.size;
    });

    const worldPos = new THREE.Vector3();

    for (const handle of ordered) {
      handle.group.getWorldPosition(worldPos);
      worldPos.y +=
        handle.labelOffsetY ?? Math.max(0.22, handle.part.size * 0.42);
      const projected = worldPos.clone().project(this.camera);

      // Behind camera check
      if (projected.z > 1 || projected.z < -1) {
        handle.labelEl.style.visibility = 'hidden';
        continue;
      }

      const sx = (projected.x * 0.5 + 0.5) * w;
      const sy = (-projected.y * 0.5 + 0.5) * h;

      // Edge bounds margin
      if (sx < 40 || sx > w - 40 || sy < 68 || sy > h - 68) {
        handle.labelEl.style.visibility = 'hidden';
        continue;
      }

      const estW = Math.max(76, (handle.labelEl.offsetWidth || 92) + 8);
      const estH = Math.max(30, (handle.labelEl.offsetHeight || 30) + 6);
      const rect = {
        x1: sx - estW / 2,
        y1: sy - estH / 2,
        x2: sx + estW / 2,
        y2: sy + estH / 2,
      };

      const isSelected = handle.part.id === this.selectedPartId;
      let collides = false;
      if (!isSelected) {
        for (const r of placedRects) {
          if (
            rect.x1 < r.x2 &&
            rect.x2 > r.x1 &&
            rect.y1 < r.y2 &&
            rect.y2 > r.y1
          ) {
            collides = true;
            break;
          }
        }
      }

      if (collides) {
        handle.labelEl.style.visibility = 'hidden';
      } else {
        placedRects.push(rect);
        handle.labelEl.style.visibility = 'visible';
        handle.labelEl.style.left = `${sx.toFixed(1)}px`;
        handle.labelEl.style.top = `${sy.toFixed(1)}px`;
      }
    }
  }

  private handleResize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  disposeLessonObjects(): void {
    this.lessonGroup.rotation.set(0, 0, 0);
    if (this.activeHero) {
      this.activeHero.dispose();
      this.lessonGroup.remove(this.activeHero.root);
      this.activeHero = null;
      for (const handle of this.partHandles.values()) {
        handle.labelEl.remove();
      }
    } else {
      for (const handle of this.partHandles.values()) {
        handle.mesh.geometry.dispose();
        handle.material.dispose();
        this.lessonGroup.remove(handle.group);
        handle.labelEl.remove();
      }
    }
    this.partHandles.clear();
    this.selectionRing.visible = false;
    this.currentLesson = null;
  }

  dispose(): void {
    this.disposed = true;
    window.cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.disposeLessonObjects();
    this.controls.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}
