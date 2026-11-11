import * as THREE from 'three';

function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context unavailable');
  }
  return { canvas, ctx };
}

/**
 * Procedural cristae inner-membrane bump & stripe texture for Mitochondria (F8.2).
 */
export function createCristaeBumpTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 12; y < 244; y += 22) {
    const grad = ctx.createLinearGradient(0, y - 8, 0, y + 8);
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.5, '#EAEAEA');
    grad.addColorStop(1, '#555555');
    ctx.fillStyle = grad;

    ctx.beginPath();
    const indent = (y / 22) % 2 === 0 ? 28 : 52;
    ctx.roundRect(indent, y - 5, 256 - indent * 1.4, 10, 5);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Subtle nuclear pore complex dimple texture for the cell Nucleus.
 */
export function createNuclearPoreTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 90; i++) {
    const x = ((i * 73) % 240) + 8;
    const y = ((i * 137) % 240) + 8;
    const r = 5 + (i % 4);
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, '#383838');
    g.addColorStop(0.65, '#B8B8B8');
    g.addColorStop(1, '#888888');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Soft radial volumetric glow sprite texture (used for Sun corona, beam hotspots, ATP glow).
 */
export function createRadialGlowTexture(
  innerHex = '#FFFFFF',
  midHex = '#FFE5A8',
): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 124);
  grad.addColorStop(0, innerHex);
  grad.addColorStop(0.32, midHex);
  grad.addColorStop(0.7, 'rgba(255, 230, 190, 0.18)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Continuous ROYGBIV optical spectrum texture for internal prism dispersion and screen caustics.
 */
export function createSpectrumGradientTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 512);
  const grad = ctx.createLinearGradient(0, 24, 0, 488);
  grad.addColorStop(0.0, 'rgba(255, 165, 165, 0.0)');
  grad.addColorStop(0.12, 'rgba(255, 148, 152, 0.92)'); // Red (700 nm)
  grad.addColorStop(0.28, 'rgba(255, 198, 150, 0.90)'); // Orange
  grad.addColorStop(0.42, 'rgba(252, 234, 162, 0.88)'); // Yellow
  grad.addColorStop(0.56, 'rgba(170, 236, 204, 0.92)'); // Green (530 nm)
  grad.addColorStop(0.72, 'rgba(174, 218, 250, 0.92)'); // Cyan / Blue
  grad.addColorStop(0.88, 'rgba(194, 174, 248, 0.94)'); // Violet (400 nm)
  grad.addColorStop(1.0, 'rgba(194, 174, 248, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Horizontal intensity falloff at left/right edges for soft optical caustic look
  const mask = ctx.createLinearGradient(0, 0, 256, 0);
  mask.addColorStop(0, 'rgba(255,255,255,0)');
  mask.addColorStop(0.2, 'rgba(255,255,255,1)');
  mask.addColorStop(0.8, 'rgba(255,255,255,1)');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 256, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Solar granulation & active photosphere texture for the Sun.
 */
export function createSolarSurfaceTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 256);
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 256);
  baseGrad.addColorStop(0, '#FFE8A6');
  baseGrad.addColorStop(0.5, '#FFF5D6');
  baseGrad.addColorStop(1, '#FFD98E');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 240; i++) {
    const x = (i * 97) % 512;
    const y = (i * 53) % 256;
    const r = 8 + (i % 18);
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    if (i % 3 === 0) {
      g.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      g.addColorStop(1, 'rgba(255, 224, 150, 0)');
    } else {
      g.addColorStop(0, 'rgba(255, 185, 115, 0.45)');
      g.addColorStop(1, 'rgba(255, 224, 150, 0)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Banded gas/cloud planet texture (Jupiter, Saturn, Venus, Neptune).
 */
export function createPlanetBandTexture(
  stops: string[],
  includeStormSpot = false,
): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 256);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  stops.forEach((col, i) => {
    grad.addColorStop(i / Math.max(1, stops.length - 1), col);
  });
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle zonal wave ripples
  for (let y = 8; y < 248; y += 6) {
    ctx.strokeStyle =
      y % 12 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(120,100,150,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 16) {
      const wy = y + Math.sin((x / 512) * Math.PI * 4 + y * 0.2) * 2.2;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }

  if (includeStormSpot) {
    ctx.save();
    ctx.translate(310, 162);
    ctx.scale(1.65, 1.0);
    const spotGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    spotGrad.addColorStop(0, '#FFB09C');
    spotGrad.addColorStop(0.6, '#F7C2AE');
    spotGrad.addColorStop(1, 'rgba(255, 215, 195, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Terrestrial planet surface texture (Earth, Mars, Mercury).
 */
export function createTerrestrialTexture(
  kind: 'earth' | 'mars' | 'mercury',
): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 256);

  if (kind === 'earth') {
    // Pastel ocean base
    ctx.fillStyle = '#A8D5F5';
    ctx.fillRect(0, 0, 512, 256);

    // Continents in soft mint & sage
    const continents: Array<[number, number, number, number]> = [
      [110, 82, 58, 42],
      [145, 155, 42, 55],
      [255, 78, 52, 36],
      [275, 138, 48, 58],
      [355, 86, 78, 46],
      [415, 178, 38, 28],
    ];
    for (const [cx, cy, rx, ry] of continents) {
      ctx.fillStyle = '#B5E8D2';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#D6F3E4';
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - 4, rx * 0.55, ry * 0.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polar ice caps & wispy cloud bands
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, 0, 512, 16);
    ctx.fillRect(0, 240, 512, 16);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.ellipse(
        (i * 67) % 480,
        35 + ((i * 41) % 185),
        48,
        8,
        0.1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  } else if (kind === 'mars') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#FAD4C8');
    grad.addColorStop(0.5, '#F5B8A6');
    grad.addColorStop(1, '#FAD4C8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    for (let i = 0; i < 45; i++) {
      ctx.fillStyle =
        i % 2 === 0 ? 'rgba(218, 138, 120, 0.32)' : 'rgba(255, 226, 214, 0.28)';
      ctx.beginPath();
      ctx.ellipse(
        (i * 83) % 512,
        24 + ((i * 47) % 208),
        18 + (i % 26),
        8 + (i % 14),
        (i % 5) * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // Polar ice caps
    ctx.fillStyle = 'rgba(255, 252, 250, 0.88)';
    ctx.fillRect(0, 0, 512, 12);
    ctx.fillRect(0, 244, 512, 12);
  } else {
    // Mercury cratered lavender-grey regolith
    ctx.fillStyle = '#DCD6EC';
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 70; i++) {
      const x = (i * 79) % 500;
      const y = 12 + ((i * 43) % 232);
      const r = 4 + (i % 14);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillStyle = 'rgba(180, 172, 206, 0.42)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Concentric ring texture with Cassini Division alpha gap for Saturn's rings.
 */
export function createSaturnRingTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  const cx = 256;
  const cy = 256;

  const grad = ctx.createRadialGradient(cx, cy, 96, cx, cy, 248);
  grad.addColorStop(0.0, 'rgba(255, 246, 224, 0.0)');
  grad.addColorStop(0.08, 'rgba(245, 232, 204, 0.35)'); // C Ring
  grad.addColorStop(0.24, 'rgba(254, 240, 200, 0.88)'); // B Ring inner
  grad.addColorStop(0.52, 'rgba(250, 230, 188, 0.92)'); // B Ring outer
  grad.addColorStop(0.58, 'rgba(255, 255, 255, 0.06)'); // Cassini Division gap!
  grad.addColorStop(0.64, 'rgba(235, 226, 252, 0.78)'); // A Ring inner
  grad.addColorStop(0.88, 'rgba(224, 214, 248, 0.65)'); // A Ring outer
  grad.addColorStop(0.95, 'rgba(248, 240, 255, 0.25)'); // F Ring
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
