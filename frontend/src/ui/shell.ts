import {
  ApiError,
  createLessonFromImage,
  createLessonFromTopic,
  getHealth,
  listLessons,
} from '../api/client';
import { revokePreviewUrl } from '../api/image';
import type { ImageMimeType, Lesson } from '../api/types';
import { getHeroLessonIfMatch } from '../app/heroLessons';
import { COPY, getErrorCopy, t } from '../app/i18n';
import { navigateTo, onRouteChange } from '../app/router';
import { store, type AppState } from '../app/store';
import { CrystalStage } from '../three/crystalStage';
import { DraggableBottomSheet } from './bottomSheet';
import { TeacherDashboardView } from './dashboard';
import { ICONS } from './icons';
import { renderLessonContent } from './lessonContent';
import { renderPhotoModal } from './photoModal';
import { resetQuizForLesson } from './quiz';
import { createScrollStorySection } from './scrollStory';
import { ScrollSequence } from './scrollSequence';
import { renderTopBar } from './topBar';

export class AppShell {
  private root: HTMLElement;
  private scrollProgressEl: HTMLElement;
  private stageContainer: HTMLElement;
  private labelLayer: HTMLElement;
  private solarContainer: HTMLElement;
  private topBarSlot: HTMLElement;
  private viewSlot: HTMLElement;
  private photoModalSlot: HTMLElement;
  private ariaLiveEl: HTMLElement;

  private lessonStage: CrystalStage | null = null;
  private scrollSequence: ScrollSequence;
  private viewResizeObserver: ResizeObserver;
  private bottomSheet: DraggableBottomSheet | null = null;
  private dashboardView: TeacherDashboardView;
  private scrollStoryCleanup: (() => void) | null = null;

  private activeAbort: AbortController | null = null;
  private slowTimerId: number | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.innerHTML = '';

    const initial = store.getState();
    document.documentElement.setAttribute(
      'data-text-scale',
      String(initial.textScale),
    );

    // Subtle top crystal scroll progress hairline
    this.scrollProgressEl = document.createElement('div');
    this.scrollProgressEl.className =
      'fixed top-0 left-0 z-50 h-[2.5px] w-0 pointer-events-none transition-[width] duration-75';
    this.scrollProgressEl.style.background =
      'linear-gradient(90deg, #B9B2EE, #B8DCF5, #B5E8D2, #FFCDB8)';

    // Full-screen 3D Crystal Stage
    this.stageContainer = document.createElement('div');
    this.stageContainer.className =
      'fixed inset-0 z-0 bg-white pointer-events-none';

    this.labelLayer = document.createElement('div');
    this.labelLayer.className =
      'fixed inset-0 z-10 pointer-events-none overflow-hidden';
    this.labelLayer.style.display = 'none';

    this.solarContainer = document.createElement('div');
    this.solarContainer.className =
      'fixed inset-0 z-0 bg-[#02030a] hidden';

    this.topBarSlot = document.createElement('div');
    this.viewSlot = document.createElement('div');
    this.viewSlot.className = 'relative z-20';

    this.photoModalSlot = document.createElement('div');
    this.photoModalSlot.style.display = 'none';

    // Accessible polite live region — F5 & F12
    this.ariaLiveEl = document.createElement('div');
    this.ariaLiveEl.className = 'sr-only';
    this.ariaLiveEl.setAttribute('aria-live', 'polite');
    this.ariaLiveEl.setAttribute('aria-atomic', 'true');

    this.scrollSequence = new ScrollSequence();
    this.root.append(
      this.scrollSequence.element,
      this.scrollProgressEl,
      this.stageContainer,
      this.solarContainer,
      this.labelLayer,
      this.topBarSlot,
      this.viewSlot,
      this.photoModalSlot,
      this.ariaLiveEl,
    );

    this.dashboardView = new TeacherDashboardView(this.viewSlot, (topic) => {
      navigateTo('/');
      store.setState({ topicInput: topic });
      void this.submitTopic(topic);
    });

    onRouteChange((route) => {
      store.setState({ route });
    });

    window.addEventListener('scroll', this.handleWindowScroll, {
      passive: true,
    });

    window.addEventListener('resize', this.handleWindowScroll, { passive: true });
    this.viewResizeObserver = new ResizeObserver(this.handleWindowScroll);
    this.viewResizeObserver.observe(this.viewSlot);

    store.subscribe((next, prev) => this.onStateChanged(next, prev));

    this.renderAll(initial, null);
    this.warmUpBackend();
  }

  // The landing page uses Canvas 2D; initialize WebGL only when a lesson starts.
  private get stage(): CrystalStage {
    if (!this.lessonStage) {
      this.lessonStage = new CrystalStage(this.stageContainer, this.labelLayer, {
        onSelectPart: (partId) => this.handleSelectPart(partId),
      });
      this.lessonStage.setLanguage(store.getState().lang);
    }
    return this.lessonStage;
  }

  private warmUpBackend(): void {
    // Fire-and-forget warm-up on page load — F2
    getHealth()
      .then((health) => {
        store.setState({ health });
      })
      .catch(() => {
        // Silent during initial warm-up
      });

    listLessons(8)
      .then((res) => {
        if (Array.isArray(res.lessons)) {
          store.setState({ recentLessons: res.lessons });
        }
      })
      .catch(() => {
        // Keep recentLessons empty if backend is offline — Rule R1 (never fake chips)
      });
  }

  private handleWindowScroll = (): void => {
    const st = store.getState();
    if (st.route !== '/' || st.explorerState !== 'idle') {
      this.scrollProgressEl.style.width = '0%';
      return;
    }
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    this.scrollProgressEl.style.width = `${(progress * 100).toFixed(1)}%`;
    this.scrollSequence.setProgress(progress);
  };

  private onStateChanged(next: AppState, prev: AppState): void {
    if (next.liveAnnouncement && next.liveAnnouncement !== prev.liveAnnouncement) {
      this.ariaLiveEl.textContent = next.liveAnnouncement;
    }

    if (next.lang !== prev.lang) {
      this.lessonStage?.setLanguage(next.lang);
    }

    // Re-render top bar whenever route, lang, or textScale changes
    if (
      next.route !== prev.route ||
      next.lang !== prev.lang ||
      next.textScale !== prev.textScale
    ) {
      renderTopBar(this.topBarSlot, next, () => this.returnToIdle());
    }

    // Photo modal changes
    if (
      next.photoModalOpen !== prev.photoModalOpen ||
      next.photoDraft !== prev.photoDraft ||
      (next.photoModalOpen && next.lang !== prev.lang)
    ) {
      renderPhotoModal(this.photoModalSlot, next, () => {
        const draft = store.getState().photoDraft;
        if (!draft) return;
        const { imageBase64, mimeType, previewUrl } = draft;
        revokePreviewUrl(previewUrl);
        store.setState({ photoModalOpen: false, photoDraft: null });
        void this.submitImage(imageBase64, mimeType);
      });
    }

    // Route or major screen transitions
    const routeChanged = next.route !== prev.route;
    const explorerChanged = next.explorerState !== prev.explorerState;
    const langChanged = next.lang !== prev.lang;
    const recentChanged =
      next.explorerState === 'idle' && next.recentLessons !== prev.recentLessons;
    const slowChanged =
      next.explorerState === 'loading' && next.slowLoading !== prev.slowLoading;

    if (routeChanged || explorerChanged || recentChanged || slowChanged) {
      this.renderMainView(next);
      return;
    }

    if (langChanged) {
      if (next.route === '/teacher') {
        this.dashboardView.setLanguage(next.lang);
      } else {
        this.renderMainView(next);
      }
      return;
    }

    // Fine-grained updates inside Ready workspace without rebuilding stage
    if (
      next.route === '/' &&
      next.explorerState === 'ready' &&
      next.lesson &&
      (next.selectedPartId !== prev.selectedPartId ||
        next.panelTab !== prev.panelTab ||
        next.insideCell !== prev.insideCell)
    ) {
      this.refreshReadyPanels(next, next.lesson);
    }
  }

  private renderAll(state: AppState, _prev: AppState | null): void {
    renderTopBar(this.topBarSlot, state, () => this.returnToIdle());
    renderPhotoModal(this.photoModalSlot, state, () => {});
    this.renderMainView(state);
  }

  private cleanupMainView(): void {
    if (this.scrollStoryCleanup) {
      this.scrollStoryCleanup();
      this.scrollStoryCleanup = null;
    }
    if (this.bottomSheet) {
      this.bottomSheet.destroy();
      this.bottomSheet = null;
    }
    this.dashboardView.unmount();
  }

  private renderMainView(state: AppState): void {
    this.cleanupMainView();
    this.viewSlot.innerHTML = '';

    const lockWorkspace =
      state.route === '/' &&
      (state.explorerState === 'ready' || state.explorerState === 'loading');
    document.body.classList.toggle('workspace-locked', lockWorkspace);
    this.scrollSequence.setVisible(!lockWorkspace);

    const customDemoSrc =
      state.lesson?.topicKey === 'solar-system'
        ? '/solar-system-demo.html'
        : state.lesson?.topicKey === 'light-prism'
          ? '/prism-demo.html'
          : state.lesson?.topicKey === 'human-cell'
            ? '/cell-demo.html'
            : null;

    const isCustomDemo =
      state.route === '/' &&
      state.explorerState === 'ready' &&
      customDemoSrc !== null;

    if (isCustomDemo && customDemoSrc) {
      this.solarContainer.classList.remove('hidden');
      this.solarContainer.style.display = 'block';
      this.stageContainer.style.display = 'none';
      this.labelLayer.style.display = 'none';
      const iframeId = `demo-iframe-${state.lesson?.topicKey}`;
      const existingIframe = this.solarContainer.querySelector('iframe');
      if (!existingIframe || existingIframe.id !== iframeId) {
        this.solarContainer.innerHTML = `<iframe id="${iframeId}" src="${customDemoSrc}" class="w-full h-full border-0 absolute inset-0 pointer-events-auto" allow="fullscreen"></iframe>`;
      }
    } else {
      this.solarContainer.classList.add('hidden');
      this.solarContainer.style.display = 'none';
      this.solarContainer.innerHTML = '';
      this.stageContainer.style.display = lockWorkspace ? 'block' : 'none';
      this.stageContainer.style.visibility = lockWorkspace ? 'visible' : 'hidden';
      this.lessonStage?.setActive(lockWorkspace);
      if (!lockWorkspace) this.labelLayer.style.display = 'none';
    }

    // Stage interactivity only in ready state
    const interactiveStage =
      state.route === '/' && state.explorerState === 'ready';
    this.stageContainer.classList.toggle(
      'pointer-events-auto',
      interactiveStage,
    );
    this.stageContainer.classList.toggle(
      'pointer-events-none',
      !interactiveStage,
    );

    if (state.route === '/teacher') {
      this.scrollProgressEl.style.width = '0%';
      this.scrollSequence.setProgress(0);
      this.dashboardView.mount(state.lang);
      return;
    }

    // Explorer route `#/`
    switch (state.explorerState) {
      case 'idle':
        this.renderIdleExplorer(state);
        this.handleWindowScroll();
        break;

      case 'loading':
        this.scrollProgressEl.style.width = '0%';
        window.scrollTo({ top: 0 });
        this.stage.setMode('loading');
        this.renderLoadingScreen(state);
        break;

      case 'error':
        this.scrollProgressEl.style.width = '0%';
        window.scrollTo({ top: 0 });
        this.scrollSequence.setProgress(0);
        this.renderErrorScreen(state);
        break;

      case 'ready':
        this.scrollProgressEl.style.width = '0%';
        window.scrollTo({ top: 0 });
        if (state.lesson) {
          this.renderReadyWorkspace(state, state.lesson);
        }
        break;
    }
  }

  private renderIdleExplorer(state: AppState): void {
    const { lang, recentLessons } = state;
    const isUr = lang === 'ur';

    const wrapper = document.createElement('div');
    wrapper.className = 'lang-fade sequence-landing';

    // Keep the prism visible between the heading and topic form.
    const heroSection = document.createElement('section');
    heroSection.className =
      'sequence-hero min-h-dvh flex flex-col justify-between px-4 sm:px-8 pt-24 pb-8 max-w-4xl mx-auto';

    const topSpacer = document.createElement('div');
    topSpacer.className = 'h-2';

    const centerStack = document.createElement('div');
    centerStack.className = 'sequence-hero__content text-center';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'sequence-hero__heading space-y-3.5 max-w-2xl mx-auto';

    const h1 = document.createElement('h1');
    h1.className = `text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#2B2A3A] tracking-tight ${
      isUr ? 'urdu-text text-center' : 'leading-[1.14]'
    }`;
    h1.setAttribute('lang', lang);
    h1.textContent = t(COPY.heroHeading, lang);

    const sub = document.createElement('p');
    sub.className = `text-base sm:text-lg text-[#6B6A80] max-w-xl mx-auto ${
      isUr ? 'urdu-text text-center' : 'leading-relaxed'
    }`;
    sub.setAttribute('lang', lang);
    sub.textContent = t(COPY.heroSubtitle, lang);

    titleWrap.append(h1, sub);

    // Crystal Prismatic Topic Form — Section 9.3, 9.4, 9.6
    const form = document.createElement('form');
    form.className =
      'crystal-input-shell max-w-2xl mx-auto p-2 pl-4 flex items-center gap-2';
    form.setAttribute('role', 'search');

    const input = document.createElement('input');
    input.id = 'prism-topic-input';
    input.type = 'text';
    input.maxLength = 120;
    input.autocomplete = 'off';
    input.value = state.topicInput;
    input.placeholder = t(COPY.topicPlaceholder, lang);
    input.dir = isUr ? 'rtl' : 'ltr';
    input.setAttribute('lang', lang);
    input.setAttribute('aria-label', t(COPY.topicPlaceholder, lang));
    input.className = `flex-1 min-w-0 min-h-[46px] bg-transparent border-none outline-none text-[#2B2A3A] placeholder-[#6B6A80]/75 text-base sm:text-lg font-semibold ${
      isUr ? 'urdu-inline text-right' : ''
    }`;

    // Update topicInput draft silently without triggering full DOM rebuild
    input.addEventListener('input', () => {
      store.getState().topicInput = input.value;
    });

    const camBtn = document.createElement('button');
    camBtn.type = 'button';
    camBtn.className = 'btn-icon shrink-0';
    camBtn.title = t(COPY.scanPageButton, lang);
    camBtn.setAttribute('aria-label', t(COPY.scanPageButton, lang));
    camBtn.innerHTML = ICONS.camera;
    camBtn.addEventListener('click', () => {
      store.setState({ photoModalOpen: true });
    });

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = `btn-primary shrink-0 ${isUr ? 'urdu-inline' : ''}`;
    submitBtn.innerHTML = `
      <span>${t(COPY.submitButton, lang)}</span>
      ${ICONS.arrowRight}
    `;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      store.setState({ topicInput: val });
      void this.submitTopic(val);
    });

    form.append(input, camBtn, submitBtn);
    centerStack.append(titleWrap, form);

    // Strictly real Recently Explored lessons only — Section 9.4 & Rule R1
    if (recentLessons.length > 0) {
      const recentBox = document.createElement('div');
      recentBox.className = 'space-y-2.5 pt-2 max-w-2xl mx-auto';

      const recLabel = document.createElement('p');
      recLabel.className = `text-xs font-bold text-[#6B6A80] ${
        isUr ? 'urdu-inline' : ''
      }`;
      recLabel.setAttribute('lang', lang);
      recLabel.textContent = t(COPY.recentlyExplored, lang);

      const chipRow = document.createElement('div');
      chipRow.className = 'flex flex-wrap items-center justify-center gap-2';

      for (const item of recentLessons) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `crystal-chip text-xs sm:text-sm ${
          isUr ? 'urdu-inline' : ''
        }`;
        chip.setAttribute('lang', lang);
        chip.textContent = t(item.title, lang) || item.topic;
        chip.addEventListener('click', () => {
          store.setState({ topicInput: item.topic });
          void this.submitTopic(item.topic);
        });
        chipRow.appendChild(chip);
      }

      recentBox.append(recLabel, chipRow);
      centerStack.appendChild(recentBox);
    }

    // Gentle Scroll Cue Button
    const scrollCueWrap = document.createElement('div');
    scrollCueWrap.className = 'flex justify-center pt-4';

    const scrollBtn = document.createElement('button');
    scrollBtn.type = 'button';
    scrollBtn.className = `crystal-chip text-xs text-[#6B6A80] hover:text-[#6E64C4] ${
      isUr ? 'urdu-inline' : ''
    }`;
    scrollBtn.innerHTML = `
      <span>${t(COPY.scrollCue, lang)}</span>
      ${ICONS.arrowDown}
    `;
    scrollBtn.addEventListener('click', () => {
      document
        .getElementById('how-prism-works')
        ?.scrollIntoView({ behavior: 'smooth' });
    });
    scrollCueWrap.appendChild(scrollBtn);

    heroSection.append(topSpacer, centerStack, scrollCueWrap);
    wrapper.appendChild(heroSection);

    // Editorial Smooth-Scrolling Museum Story Below the Fold
    const story = createScrollStorySection(lang, {
      onFocusExploreTop: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.setTimeout(() => {
          document.getElementById('prism-topic-input')?.focus();
        }, 420);
      },
      onOpenTeacherView: () => navigateTo('/teacher'),
    });
    this.scrollStoryCleanup = story.cleanup;
    wrapper.appendChild(story.element);

    this.viewSlot.appendChild(wrapper);
  }

  private renderLoadingScreen(state: AppState): void {
    const { lang, slowLoading } = state;
    const isUr = lang === 'ur';

    const screen = document.createElement('main');
    screen.className =
      'min-h-dvh flex flex-col items-center justify-end pb-14 px-4 pointer-events-none lang-fade';

    const capsule = document.createElement('div');
    capsule.className =
      'crystal-surface-strong rounded-[26px] px-7 py-6 max-w-md w-full text-center space-y-4 pointer-events-auto';

    const pulseRow = document.createElement('div');
    pulseRow.className = 'flex items-center justify-center gap-2';
    for (const color of ['#B9B2EE', '#B8DCF5', '#B5E8D2', '#FFCDB8']) {
      const dot = document.createElement('span');
      dot.className = 'w-2.5 h-2.5 rounded-full animate-pulse';
      dot.style.backgroundColor = color;
      pulseRow.appendChild(dot);
    }

    const mainText = document.createElement('p');
    mainText.className = `text-lg font-extrabold text-[#2B2A3A] ${
      isUr ? 'urdu-text text-center' : ''
    }`;
    mainText.setAttribute('lang', lang);
    mainText.textContent = t(COPY.loadingMain, lang);

    capsule.append(pulseRow, mainText);

    if (slowLoading) {
      const slowP = document.createElement('p');
      slowP.className = `text-sm text-[#6B6A80] ${
        isUr ? 'urdu-text text-center' : 'leading-relaxed'
      }`;
      slowP.setAttribute('lang', lang);
      slowP.textContent = t(COPY.loadingSlowStart, lang);
      capsule.appendChild(slowP);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = `btn-secondary ${isUr ? 'urdu-inline' : ''}`;
    cancelBtn.textContent = t(COPY.cancelButton, lang);
    cancelBtn.addEventListener('click', () => {
      this.cancelActiveRequest();
      this.returnToIdle();
    });
    capsule.appendChild(cancelBtn);

    screen.appendChild(capsule);
    this.viewSlot.appendChild(screen);
  }

  private renderErrorScreen(state: AppState): void {
    const { lang, errorCode, lastSubmission } = state;
    const isUr = lang === 'ur';
    const message = getErrorCopy(errorCode ?? 'INTERNAL', lang);

    const screen = document.createElement('main');
    screen.className =
      'min-h-dvh flex items-center justify-center px-4 pt-20 pb-10 lang-fade';

    const card = document.createElement('div');
    card.setAttribute('role', 'alert');
    card.className =
      'crystal-surface-strong rounded-[28px] p-8 sm:p-10 max-w-md w-full text-center space-y-6';

    const iconWrap = document.createElement('div');
    iconWrap.className =
      'w-14 h-14 rounded-full bg-[#F7F6FD] border border-[rgba(111,100,196,0.18)] flex items-center justify-center mx-auto';
    iconWrap.innerHTML = ICONS.prismLogo;

    const msgEl = document.createElement('p');
    msgEl.className = `text-base sm:text-lg font-bold text-[#2B2A3A] ${
      isUr ? 'urdu-text text-center' : 'leading-relaxed'
    }`;
    msgEl.setAttribute('lang', lang);
    msgEl.textContent = message;

    const btnRow = document.createElement('div');
    btnRow.className = 'flex flex-wrap items-center justify-center gap-3';

    if (lastSubmission) {
      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = `btn-primary ${isUr ? 'urdu-inline' : ''}`;
      retryBtn.textContent = t(COPY.tryAgain, lang);
      retryBtn.addEventListener('click', () => {
        if (lastSubmission.kind === 'topic' && lastSubmission.topic) {
          void this.submitTopic(lastSubmission.topic);
        } else if (
          lastSubmission.kind === 'image' &&
          lastSubmission.imageBase64 &&
          lastSubmission.mimeType
        ) {
          void this.submitImage(
            lastSubmission.imageBase64,
            lastSubmission.mimeType,
          );
        }
      });
      btnRow.appendChild(retryBtn);
    }

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = `btn-secondary ${isUr ? 'urdu-inline' : ''}`;
    backBtn.textContent = t(COPY.backToExplore, lang);
    backBtn.addEventListener('click', () => this.returnToIdle());
    btnRow.appendChild(backBtn);

    card.append(iconWrap, msgEl, btnRow);
    screen.appendChild(card);
    this.viewSlot.appendChild(screen);
  }

  private desktopPanelBody: HTMLElement | null = null;
  private stageActionCluster: HTMLElement | null = null;

  private renderReadyWorkspace(state: AppState, lesson: Lesson): void {
    // Floating stage action controls (New topic, Reset view, Go inside/Back outside)
    const controlsWrap = document.createElement('div');
    controlsWrap.className =
      'fixed left-3 sm:left-6 top-20 z-30 flex flex-wrap items-center gap-2 pointer-events-auto';
    this.stageActionCluster = controlsWrap;

    // Desktop Side Panel (>= 1024px) — Section 9.4 & F6
    const sidePanel = document.createElement('aside');
    sidePanel.className =
      'desktop-panel hidden lg:flex flex-col fixed right-5 top-20 bottom-5 w-[396px] z-30 overflow-hidden pointer-events-auto';

    const sideBody = document.createElement('div');
    sideBody.className = 'flex-1 overflow-y-auto p-6';
    sidePanel.appendChild(sideBody);
    this.desktopPanelBody = sideBody;

    // Mobile Draggable Bottom Sheet (< 1024px) — Section 9.4 & F6
    this.bottomSheet = new DraggableBottomSheet((snap) => {
      store.setState({ sheetSnap: snap });
    });

    this.viewSlot.append(controlsWrap, sidePanel, this.bottomSheet.element);

    const isCustomDemo =
      lesson.topicKey === 'solar-system' ||
      lesson.topicKey === 'light-prism' ||
      lesson.topicKey === 'human-cell';

    if (isCustomDemo) {
      sidePanel.style.display = 'none';
      this.bottomSheet.element.style.display = 'none';
    }

    window.requestAnimationFrame(() => {
      this.bottomSheet?.setSnap(state.sheetSnap, true);
    });

    this.refreshReadyPanels(state, lesson);
  }

  private refreshReadyPanels(state: AppState, lesson: Lesson): void {
    const { lang, insideCell } = state;
    const isUr = lang === 'ur';

    if (this.stageActionCluster) {
      this.stageActionCluster.innerHTML = '';

      const newBtn = document.createElement('button');
      newBtn.type = 'button';
      newBtn.className = `btn-secondary text-xs sm:text-sm ${
        isUr ? 'urdu-inline' : ''
      }`;
      newBtn.textContent = t(COPY.newTopicButton, lang);
      newBtn.addEventListener('click', () => this.returnToIdle());

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = `btn-secondary text-xs sm:text-sm ${
        isUr ? 'urdu-inline' : ''
      }`;
      resetBtn.innerHTML = `
        ${ICONS.reset}
        <span>${t(COPY.resetView, lang)}</span>
      `;
      resetBtn.addEventListener('click', () => {
        store.setState({ selectedPartId: null, insideCell: false });
        this.stage.selectPart(null);
        this.stage.resetView();
      });

      if (
        lesson.topicKey === 'solar-system' ||
        lesson.topicKey === 'light-prism' ||
        lesson.topicKey === 'human-cell'
      ) {
        this.stageActionCluster.appendChild(newBtn);
        return;
      }

      this.stageActionCluster.append(newBtn, resetBtn);

      if (lesson.topicKey === 'human-cell') {
        const insideBtn = document.createElement('button');
        insideBtn.type = 'button';
        insideBtn.className = `btn-primary text-xs sm:text-sm ${
          isUr ? 'urdu-inline' : ''
        }`;
        insideBtn.innerHTML = `
          ${ICONS.inside}
          <span>${t(insideCell ? COPY.backOutside : COPY.goInside, lang)}</span>
        `;
        insideBtn.addEventListener('click', () => {
          const nextInside = !store.getState().insideCell;
          store.setState({ insideCell: nextInside });
          this.stage.setInsideCell(nextInside);
        });
        this.stageActionCluster.appendChild(insideBtn);
      }
    }

    const panelActions = {
      onSelectPart: (partId: string | null) => this.handleSelectPart(partId),
      onControlChange: (controlId: string, value: number) => {
        const curr = store.getState();
        const nextValues = { ...curr.controlValues, [controlId]: value };
        store.getState().controlValues = nextValues;
        if (curr.lesson) {
          this.stage.applyControls(curr.lesson.controls, nextValues);
        }
      },
      onRerenderQuiz: () => {
        const curr = store.getState();
        if (curr.lesson) this.refreshReadyPanels(curr, curr.lesson);
      },
    };

    if (this.desktopPanelBody) {
      renderLessonContent(this.desktopPanelBody, lesson, state, panelActions);
    }
    if (this.bottomSheet) {
      renderLessonContent(
        this.bottomSheet.bodyElement,
        lesson,
        state,
        panelActions,
      );
    }
  }

  private handleSelectPart(partId: string | null): void {
    const curr = store.getState();
    if (!curr.lesson) return;

    this.stage.selectPart(partId);
    const part = partId
      ? curr.lesson.parts.find((p) => p.id === partId)
      : undefined;
    const announcement = part ? t(part.name, curr.lang) : '';

    const nextSnap =
      partId && curr.sheetSnap === 'peek' ? 'half' : curr.sheetSnap;
    store.setState({
      selectedPartId: partId,
      panelTab: 'explore',
      sheetSnap: nextSnap,
      liveAnnouncement: announcement,
    });
    if (partId && this.bottomSheet && curr.sheetSnap === 'peek') {
      this.bottomSheet.setSnap('half');
    }
  }

  private returnToIdle(): void {
    this.cancelActiveRequest();
    this.lessonStage?.disposeLessonObjects();
    this.solarContainer.classList.add('hidden');
    this.solarContainer.style.display = 'none';
    this.solarContainer.innerHTML = '';
    this.stageContainer.style.display = 'block';
    store.setState({
      explorerState: 'idle',
      errorCode: null,
      selectedPartId: null,
      insideCell: false,
    });
  }

  private cancelActiveRequest(): void {
    if (this.slowTimerId !== null) {
      window.clearTimeout(this.slowTimerId);
      this.slowTimerId = null;
    }
    if (this.activeAbort) {
      this.activeAbort.abort();
      this.activeAbort = null;
    }
  }

  private beginLoadingCycle(): AbortController {
    this.cancelActiveRequest();
    const controller = new AbortController();
    this.activeAbort = controller;

    store.setState({
      explorerState: 'loading',
      slowLoading: false,
      errorCode: null,
    });

    // After 8 seconds show cold-start notice — Section 9.6 & F11
    this.slowTimerId = window.setTimeout(() => {
      if (store.getState().explorerState === 'loading') {
        store.setState({ slowLoading: true });
      }
    }, 8_000);

    return controller;
  }

  async submitTopic(rawTopic: string): Promise<void> {
    const cleaned = rawTopic.trim();
    if (cleaned.length < 2 || cleaned.length > 120) {
      store.setState({
        explorerState: 'error',
        errorCode: 'BAD_REQUEST',
        lastSubmission: null,
        liveAnnouncement: getErrorCopy('BAD_REQUEST', store.getState().lang),
      });
      return;
    }

    const controller = this.beginLoadingCycle();
    store.setState({
      lastSubmission: { kind: 'topic', topic: cleaned },
    });

    const heroLesson = getHeroLessonIfMatch(cleaned);
    if (heroLesson) {
      // Natural museum loading choreography delay (~1300ms) requested by user
      window.setTimeout(() => {
        if (controller.signal.aborted) return;
        this.activateLoadedLesson(heroLesson, {
          cached: true,
          model: 'canonical-hero',
          generatedAt: new Date().toISOString(),
          source: 'text',
          requestId: 'hero-' + Date.now().toString(36),
        });
      }, 1300);
      return;
    }

    try {
      const response = await createLessonFromTopic(cleaned, controller.signal);
      this.activateLoadedLesson(response.lesson, response.meta);
    } catch (err) {
      this.handleLessonError(err);
    }
  }

  async submitImage(
    imageBase64: string,
    mimeType: ImageMimeType,
  ): Promise<void> {
    const controller = this.beginLoadingCycle();
    store.setState({
      lastSubmission: { kind: 'image', imageBase64, mimeType },
    });

    try {
      const response = await createLessonFromImage(
        imageBase64,
        mimeType,
        controller.signal,
      );
      this.activateLoadedLesson(response.lesson, response.meta);
    } catch (err) {
      this.handleLessonError(err);
    }
  }

  private activateLoadedLesson(
    lesson: Lesson,
    meta: AppState['lessonMeta'],
  ): void {
    if (this.slowTimerId !== null) {
      window.clearTimeout(this.slowTimerId);
      this.slowTimerId = null;
    }
    this.activeAbort = null;

    resetQuizForLesson(lesson);

    const defaults: Record<string, number> = {};
    for (const ctrl of lesson.controls) {
      defaults[ctrl.id] = ctrl.default;
    }

    const currLang = store.getState().lang;
    this.stage.loadLesson(lesson, currLang);
    this.stage.applyControls(lesson.controls, defaults);

    store.setState({
      lesson,
      lessonMeta: meta,
      controlValues: defaults,
      selectedPartId: null,
      panelTab: 'explore',
      sheetSnap: 'peek',
      insideCell: false,
      explorerState: 'ready',
      slowLoading: false,
      errorCode: null,
      liveAnnouncement: t(lesson.title, currLang),
    });

    // Refresh recent lessons quietly in background
    listLessons(8)
      .then((res) => {
        if (Array.isArray(res.lessons)) {
          store.setState({ recentLessons: res.lessons });
        }
      })
      .catch(() => {});
  }

  private handleLessonError(err: unknown): void {
    if (this.slowTimerId !== null) {
      window.clearTimeout(this.slowTimerId);
      this.slowTimerId = null;
    }
    this.activeAbort = null;

    if (err instanceof ApiError && err.code === 'ABORTED') {
      return;
    }

    const code = err instanceof ApiError ? err.code : 'NETWORK_ERROR';
    const msg = getErrorCopy(code, store.getState().lang);
    store.setState({
      explorerState: 'error',
      errorCode: code,
      slowLoading: false,
      liveAnnouncement: msg,
    });
  }
}

