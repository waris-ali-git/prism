import gsap from 'gsap';
import type { SheetSnap } from '../app/store';

export class DraggableBottomSheet {
  readonly element: HTMLElement;
  readonly bodyElement: HTMLElement;
  private snap: SheetSnap = 'peek';
  private onSnapChange: (snap: SheetSnap) => void;
  private startY = 0;
  private startTranslate = 0;
  private currentTranslate = 0;
  private dragging = false;

  constructor(onSnapChange: (snap: SheetSnap) => void) {
    this.onSnapChange = onSnapChange;

    this.element = document.createElement('aside');
    this.element.className =
      'mobile-sheet fixed inset-x-0 bottom-0 z-30 lg:hidden flex flex-col h-[84dvh]';

    const handleArea = document.createElement('div');
    handleArea.className =
      'w-full pt-3 pb-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0 select-none';
    handleArea.innerHTML = `
      <span class="w-11 h-1.5 rounded-full bg-[#8F86D6]/35"></span>
    `;

    this.bodyElement = document.createElement('div');
    this.bodyElement.className =
      'flex-1 overflow-y-auto px-5 pb-8 pt-1 touch-pan-y';

    this.element.append(handleArea, this.bodyElement);

    handleArea.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    handleArea.addEventListener('click', () => {
      if (!this.dragging) {
        const next: SheetSnap =
          this.snap === 'peek'
            ? 'half'
            : this.snap === 'half'
              ? 'full'
              : 'peek';
        this.setSnap(next);
        this.onSnapChange(next);
      }
    });
  }

  private getTranslateForSnap(snap: SheetSnap): number {
    const h = this.element.offsetHeight || window.innerHeight * 0.84;
    if (snap === 'full') return 0;
    if (snap === 'half') return h * 0.42;
    return Math.max(0, h - 168); // peek leaves stage spaciously visible
  }

  setSnap(snap: SheetSnap, immediate = false): void {
    this.snap = snap;
    const targetY = this.getTranslateForSnap(snap);
    this.currentTranslate = targetY;
    if (immediate) {
      this.element.style.transform = `translateY(${targetY}px)`;
    } else {
      gsap.to(this.element, {
        y: targetY,
        duration: 0.38,
        ease: 'power3.out',
      });
    }
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.dragging = true;
    this.startY = e.clientY;
    this.startTranslate = this.getTranslateForSnap(this.snap);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const dy = e.clientY - this.startY;
    const maxT = this.getTranslateForSnap('peek') + 24;
    const next = Math.max(0, Math.min(maxT, this.startTranslate + dy));
    this.currentTranslate = next;
    gsap.set(this.element, { y: next });
  };

  private onPointerUp = (): void => {
    if (!this.dragging) return;
    this.dragging = false;

    const fullY = this.getTranslateForSnap('full');
    const halfY = this.getTranslateForSnap('half');
    const peekY = this.getTranslateForSnap('peek');

    const dists: Array<{ snap: SheetSnap; dist: number }> = [
      { snap: 'full', dist: Math.abs(this.currentTranslate - fullY) },
      { snap: 'half', dist: Math.abs(this.currentTranslate - halfY) },
      { snap: 'peek', dist: Math.abs(this.currentTranslate - peekY) },
    ];
    dists.sort((a, b) => a.dist - b.dist);
    const chosen = dists[0]?.snap ?? 'half';
    this.setSnap(chosen);
    this.onSnapChange(chosen);
  };

  destroy(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }
}

