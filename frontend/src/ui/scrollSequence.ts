const frameUrls = Object.entries(
  import.meta.glob<string>(
    '../../../assets/ezgif-5850b78a2b02ac3f-jpg/ezgif-frame-*.jpg',
    { query: '?url', import: 'default', eager: true },
  ),
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => url);

/** Decorative, scroll-scrubbed footage. No timer advances the playhead. */
export class ScrollSequence {
  readonly element = document.createElement('div');
  private canvas = document.createElement('canvas');
  private context: CanvasRenderingContext2D | null;
  private frames = new Map<number, HTMLImageElement>();
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private resizeObserver: ResizeObserver;
  private progress = 0;
  private drawnFrame: number | null = null;
  private rafId = 0;
  private visible = true;
  private disposed = false;

  constructor() {
    this.element.className = 'scroll-sequence';
    this.element.setAttribute('aria-hidden', 'true');
    // Show the first image immediately while Canvas frames decode.
    const firstUrl = frameUrls[0];
    if (firstUrl) {
      const poster = document.createElement('img');
      poster.className = 'scroll-sequence__poster';
      poster.alt = '';
      poster.fetchPriority = 'high';
      poster.src = firstUrl;
      this.element.append(poster);
    }
    this.canvas.className = 'scroll-sequence__canvas';
    this.element.append(this.canvas);
    this.context = this.canvas.getContext('2d', { alpha: false });
    this.resizeObserver = new ResizeObserver(this.requestDraw);
    this.resizeObserver.observe(this.element);
    this.reducedMotion.addEventListener('change', this.requestDraw);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    if (this.context) void this.preload();
  }

  setProgress(progress: number): void {
    const next = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
    if (this.progress === next) return;
    this.progress = next;
    this.requestDraw();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.element.hidden = !visible;
    if (visible) this.requestDraw();
    else this.cancelDraw();
  }

  private get targetFrame(): number {
    return this.reducedMotion.matches
      ? 0
      : Math.round(this.progress * Math.max(0, frameUrls.length - 1));
  }

  private async loadFrame(index: number): Promise<void> {
    const url = frameUrls[index];
    if (!url || this.disposed) return;
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = index === 0 ? 'high' : 'low';
    image.src = url;
    try {
      await image.decode();
      if (this.disposed) return;
      this.frames.set(index, image);
      if (this.drawnFrame === null || Math.abs(index - this.targetFrame) <= 1) {
        this.requestDraw();
      }
    } catch {
      // Keep the last valid frame (or the white page) if one image fails.
    }
  }

  private async preload(): Promise<void> {
    await this.loadFrame(0);
    // Three workers avoid competing with fonts and the first visible frame.
    let next = 1;
    const worker = async () => {
      while (!this.disposed && next < frameUrls.length) {
        await this.loadFrame(next++);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  private cancelDraw(): void {
    window.cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private onVisibilityChange = (): void => {
    if (document.hidden) this.cancelDraw();
    else this.requestDraw();
  };

  private requestDraw = (): void => {
    if (this.disposed || !this.visible || document.hidden || this.rafId) return;
    this.rafId = window.requestAnimationFrame(this.draw);
  };

  private draw = (): void => {
    this.rafId = 0;
    const context = this.context;
    if (!context || this.disposed || !this.visible || document.hidden) return;
    const position = this.reducedMotion.matches
      ? 0
      : this.progress * Math.max(0, frameUrls.length - 1);
    const target = Math.floor(position);
    const index = this.frames.has(target)
      ? target
      : this.drawnFrame ?? this.frames.keys().next().value;
    if (index === undefined) return;
    const image = this.frames.get(index);
    if (!image) return;

    const width = this.element.clientWidth;
    const height = this.element.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);

    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawnWidth) / 2, (height - drawnHeight) / 2,
      drawnWidth, drawnHeight);
    // Blend adjacent source frames using scroll position, never elapsed time.
    const nextImage = this.frames.get(target + 1);
    if (index === target && nextImage && position > target) {
      context.globalAlpha = position - target;
      context.drawImage(nextImage, (width - drawnWidth) / 2, (height - drawnHeight) / 2,
        drawnWidth, drawnHeight);
      context.globalAlpha = 1;
    }
    this.drawnFrame = index;
    this.canvas.dataset.frame = String(index + 1);
  };

  dispose(): void {
    this.disposed = true;
    this.cancelDraw();
    this.resizeObserver.disconnect();
    this.reducedMotion.removeEventListener('change', this.requestDraw);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.frames.clear();
    this.element.remove();
  }
}
