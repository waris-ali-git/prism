import gsap from 'gsap';
import type { Language } from '../api/types';
import { COPY, t } from '../app/i18n';
import { ICONS } from './icons';

export interface ScrollStoryCallbacks {
  onFocusExploreTop: () => void;
  onOpenTeacherView: () => void;
}

export function createScrollStorySection(
  lang: Language,
  callbacks: ScrollStoryCallbacks,
): {
  element: HTMLElement;
  cleanup: () => void;
} {
  const isUr = lang === 'ur';
  const section = document.createElement('section');
  section.id = 'how-prism-works';
  section.className =
    'relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-24 space-y-20 md:space-y-28';

  const spectralLine = document.createElement('div');
  spectralLine.className = 'spectral-hairline';
  section.appendChild(spectralLine);

  // Editorial intro heading
  const introWrap = document.createElement('div');
  introWrap.className = 'scroll-chapter max-w-3xl mx-auto text-center space-y-4';
  const introTitle = document.createElement('h2');
  introTitle.className = `text-2xl sm:text-3xl md:text-[2.15rem] font-extrabold text-[#2B2A3A] tracking-tight ${
    isUr ? 'urdu-text text-center' : 'leading-tight'
  }`;
  introTitle.setAttribute('lang', lang);
  introTitle.textContent = t(COPY.storyIntroHeading, lang);
  introWrap.appendChild(introTitle);
  section.appendChild(introWrap);

  // CHAPTER 1 — From flat textbook page to spatial crystal layers
  const ch1 = document.createElement('div');
  ch1.className =
    'scroll-chapter grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center';

  const ch1Visual = document.createElement('div');
  ch1Visual.className =
    'lg:col-span-6 crystal-surface rounded-[28px] p-7 sm:p-9 relative overflow-hidden min-h-[270px] flex items-center justify-center';
  ch1Visual.innerHTML = `
    <div class="relative w-full max-w-[340px] h-[210px] flex items-center justify-center" aria-hidden="true">
      <!-- Base textbook sheet -->
      <div class="parallax-float-slow absolute w-52 h-36 rounded-[20px] bg-[#F7F6FD] border border-[rgba(111,100,196,0.18)] shadow-sm transform -rotate-6 translate-y-5 flex flex-col justify-between p-4">
        <div class="w-20 h-2.5 rounded-full bg-[#B9B2EE]/55"></div>
        <div class="space-y-2">
          <div class="w-full h-2 rounded-full bg-[#6B6A80]/15"></div>
          <div class="w-4/5 h-2 rounded-full bg-[#6B6A80]/15"></div>
          <div class="w-3/5 h-2 rounded-full bg-[#6B6A80]/15"></div>
        </div>
      </div>
      <!-- Elevated frosted crystal layer -->
      <div class="parallax-float-mid absolute w-52 h-36 rounded-[22px] bg-white/75 backdrop-blur-xl border border-[rgba(143,134,214,0.28)] shadow-[0_18px_38px_rgba(111,100,196,0.13)] transform rotate-3 -translate-y-3 flex items-center justify-center">
        <div class="relative flex items-center justify-center">
          <span class="w-16 h-16 rounded-full bg-[#B9B2EE]/45 blur-[1px]"></span>
          <span class="absolute w-9 h-9 rounded-full bg-[#FFCDB8]/85 shadow-inner translate-x-5 -translate-y-3"></span>
          <span class="absolute w-7 h-7 rounded-full bg-[#B5E8D2]/90 -translate-x-6 translate-y-4"></span>
          <span class="absolute w-5 h-5 rounded-full bg-[#B8DCF5]/95 translate-x-6 translate-y-5"></span>
        </div>
      </div>
    </div>
  `;

  const ch1Copy = document.createElement('div');
  ch1Copy.className = `lg:col-span-6 space-y-4 ${isUr ? 'text-right' : ''}`;
  const ch1Badge = document.createElement('span');
  ch1Badge.className =
    'inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#B9B2EE]/28 text-[#6E64C4] font-extrabold text-sm';
  ch1Badge.textContent = '1';

  const ch1Title = document.createElement('h3');
  ch1Title.className = `text-xl sm:text-2xl font-extrabold text-[#2B2A3A] ${
    isUr ? 'urdu-text' : 'leading-snug'
  }`;
  ch1Title.setAttribute('lang', lang);
  ch1Title.textContent = t(COPY.storyStep1Title, lang);

  const ch1Body = document.createElement('p');
  ch1Body.className = `text-base text-[#6B6A80] max-w-xl ${
    isUr ? 'urdu-text ml-auto' : 'leading-relaxed'
  }`;
  ch1Body.setAttribute('lang', lang);
  ch1Body.textContent = t(COPY.storyStep1Body, lang);

  ch1Copy.append(ch1Badge, ch1Title, ch1Body);
  ch1.append(ch1Visual, ch1Copy);
  section.appendChild(ch1);

  // CHAPTER 2 — Interactive Crystal Refraction & Dispersion Playground
  const ch2 = document.createElement('div');
  ch2.className =
    'scroll-chapter grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center';

  const ch2Copy = document.createElement('div');
  ch2Copy.className = `lg:col-span-5 space-y-4 order-2 lg:order-1 ${
    isUr ? 'text-right' : ''
  }`;

  const ch2Badge = document.createElement('span');
  ch2Badge.className =
    'inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#B8DCF5]/42 text-[#6E64C4] font-extrabold text-sm';
  ch2Badge.textContent = '2';

  const ch2Title = document.createElement('h3');
  ch2Title.className = `text-xl sm:text-2xl font-extrabold text-[#2B2A3A] ${
    isUr ? 'urdu-text' : 'leading-snug'
  }`;
  ch2Title.setAttribute('lang', lang);
  ch2Title.textContent = t(COPY.storyStep2Title, lang);

  const ch2Body = document.createElement('p');
  ch2Body.className = `text-base text-[#6B6A80] ${
    isUr ? 'urdu-text' : 'leading-relaxed'
  }`;
  ch2Body.setAttribute('lang', lang);
  ch2Body.textContent = t(COPY.storyStep2Body, lang);

  ch2Copy.append(ch2Badge, ch2Title, ch2Body);

  const ch2Interactive = document.createElement('div');
  ch2Interactive.className =
    'lg:col-span-7 order-1 lg:order-2 crystal-surface rounded-[28px] p-6 sm:p-8 space-y-5';

  const svgHolder = document.createElement('div');
  svgHolder.className =
    'w-full rounded-[20px] bg-[#F7F6FD]/85 border border-[rgba(111,100,196,0.12)] p-4 overflow-hidden';

  svgHolder.innerHTML = `
    <svg viewBox="0 0 520 210" class="w-full h-auto block" role="img" aria-label="Interactive optical crystal prism dispersing pastel light rays">
      <defs>
        <linearGradient id="crystalBodyGrad" x1="180" y1="30" x2="310" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
          <stop offset="55%" stop-color="#EAE7FC" stop-opacity="0.78"/>
          <stop offset="100%" stop-color="#DDF0FC" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <!-- Incoming soft beam -->
      <line x1="24" y1="132" x2="212" y2="106" stroke="#8F86D6" stroke-width="4" stroke-linecap="round" stroke-opacity="0.55" />
      <!-- Internal refracted beam -->
      <line x1="212" y1="106" x2="294" y2="102" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
      <!-- Dispersed pastel spectrum rays -->
      <line data-ray="0" x1="294" y1="102" x2="494" y2="54" stroke="#B9B2EE" stroke-width="5" stroke-linecap="round" />
      <line data-ray="1" x1="294" y1="102" x2="494" y2="76" stroke="#B8DCF5" stroke-width="5" stroke-linecap="round" />
      <line data-ray="2" x1="294" y1="102" x2="494" y2="98" stroke="#B5E8D2" stroke-width="5" stroke-linecap="round" />
      <line data-ray="3" x1="294" y1="102" x2="494" y2="120" stroke="#FBE9A8" stroke-width="5" stroke-linecap="round" />
      <line data-ray="4" x1="294" y1="102" x2="494" y2="142" stroke="#FFCDB8" stroke-width="5" stroke-linecap="round" />
      <line data-ray="5" x1="294" y1="102" x2="494" y2="164" stroke="#F6BFD3" stroke-width="5" stroke-linecap="round" />
      <!-- Faceted optical crystal prism -->
      <polygon points="252,28 326,172 178,172" fill="url(#crystalBodyGrad)" stroke="#8F86D6" stroke-width="2" stroke-linejoin="round" />
      <line x1="252" y1="28" x2="252" y2="172" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.85" />
    </svg>
  `;

  const sliderRow = document.createElement('div');
  sliderRow.className = 'space-y-1.5';

  const sliderHeader = document.createElement('div');
  sliderHeader.className = 'flex items-center justify-between gap-2';

  const sliderLbl = document.createElement('label');
  sliderLbl.htmlFor = 'demo-dispersion-slider';
  sliderLbl.className = `text-sm font-bold text-[#2B2A3A] ${
    isUr ? 'urdu-inline' : ''
  }`;
  sliderLbl.textContent = t(COPY.prismDemoSliderLabel, lang);

  const sliderVal = document.createElement('span');
  sliderVal.className =
    'text-xs font-bold text-[#6E64C4] px-2.5 py-1 rounded-full bg-[#F7F6FD] border border-[rgba(111,100,196,0.14)]';
  sliderVal.textContent = '62%';

  sliderHeader.append(sliderLbl, sliderVal);

  const demoInput = document.createElement('input');
  demoInput.id = 'demo-dispersion-slider';
  demoInput.type = 'range';
  demoInput.min = '15';
  demoInput.max = '100';
  demoInput.value = '62';
  demoInput.className = 'prism-slider';

  const updateRays = (pct: number) => {
    sliderVal.textContent = `${Math.round(pct)}%`;
    const spread = (pct / 100) * 76;
    const centerY = 108;
    const rays = svgHolder.querySelectorAll<SVGLineElement>('line[data-ray]');
    rays.forEach((line, idx) => {
      const norm = (idx - 2.5) / 2.5; // -1 .. +1
      const y2 = centerY + norm * spread;
      line.setAttribute('y2', y2.toFixed(1));
    });
  };

  demoInput.addEventListener('input', () => {
    updateRays(Number(demoInput.value));
  });
  updateRays(62);

  sliderRow.append(sliderHeader, demoInput);
  ch2Interactive.append(svgHolder, sliderRow);
  ch2.append(ch2Copy, ch2Interactive);
  section.appendChild(ch2);

  // CHAPTER 3 — Bilingual English & Nastaliq Urdu Harmony
  const ch3 = document.createElement('div');
  ch3.className =
    'scroll-chapter grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center';

  const ch3Visual = document.createElement('div');
  ch3Visual.className =
    'lg:col-span-6 crystal-surface rounded-[28px] p-6 sm:p-8 space-y-4';
  ch3Visual.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-[20px] p-4 bg-white/85 border border-[rgba(111,100,196,0.14)] space-y-2">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#B9B2EE]/25 text-[#6E64C4]">English</span>
        <p class="text-sm font-semibold text-[#2B2A3A] leading-relaxed">
          Clear, age-appropriate explanations built for grades 6 to 12.
        </p>
      </div>
      <div class="rounded-[20px] p-4 bg-[#F7F6FD]/95 border border-[rgba(111,100,196,0.16)] space-y-2 text-right" dir="rtl" lang="ur">
        <span class="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-[#B5E8D2]/45 text-[#2B2A3A] urdu-inline">اردو</span>
        <p class="urdu-text text-sm text-[#2B2A3A]">
          فطری اور سلیس درسی اردو، صاف نستعلیق رسم الخط کے ساتھ۔
        </p>
      </div>
    </div>
    <p class="text-xs text-[#6B6A80] ${isUr ? 'urdu-text' : 'leading-relaxed'}" lang="${lang}">
      ${t(COPY.aiFooter, lang)}
    </p>
  `;

  const ch3Copy = document.createElement('div');
  ch3Copy.className = `lg:col-span-6 space-y-4 ${isUr ? 'text-right' : ''}`;

  const ch3Badge = document.createElement('span');
  ch3Badge.className =
    'inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#B5E8D2]/50 text-[#2B2A3A] font-extrabold text-sm';
  ch3Badge.textContent = '3';

  const ch3Title = document.createElement('h3');
  ch3Title.className = `text-xl sm:text-2xl font-extrabold text-[#2B2A3A] ${
    isUr ? 'urdu-text' : 'leading-snug'
  }`;
  ch3Title.setAttribute('lang', lang);
  ch3Title.textContent = t(COPY.storyStep3Title, lang);

  const ch3Body = document.createElement('p');
  ch3Body.className = `text-base text-[#6B6A80] max-w-xl ${
    isUr ? 'urdu-text ml-auto' : 'leading-relaxed'
  }`;
  ch3Body.setAttribute('lang', lang);
  ch3Body.textContent = t(COPY.storyStep3Body, lang);

  ch3Copy.append(ch3Badge, ch3Title, ch3Body);
  ch3.append(ch3Visual, ch3Copy);
  section.appendChild(ch3);

  // Serene Crystal Bottom Call-To-Action
  const bottomCard = document.createElement('div');
  bottomCard.className =
    'scroll-chapter crystal-surface-strong rounded-[28px] p-8 sm:p-11 text-center space-y-6 max-w-3xl mx-auto';

  const bottomIcon = document.createElement('div');
  bottomIcon.className =
    'w-12 h-12 rounded-full bg-[#F7F6FD] border border-[rgba(111,100,196,0.18)] text-[#6E64C4] flex items-center justify-center mx-auto';
  bottomIcon.innerHTML = ICONS.sparkCrystal;

  const bottomHeading = document.createElement('h3');
  bottomHeading.className = `text-xl sm:text-2xl font-extrabold text-[#2B2A3A] ${
    isUr ? 'urdu-text text-center' : ''
  }`;
  bottomHeading.setAttribute('lang', lang);
  bottomHeading.textContent = t(COPY.storyBottomCtaTitle, lang);

  const bottomActions = document.createElement('div');
  bottomActions.className =
    'flex flex-wrap items-center justify-center gap-3.5 pt-1';

  const startBtn = document.createElement('button');
  startBtn.type = 'button';
  startBtn.className = `btn-primary ${isUr ? 'urdu-inline' : ''}`;
  startBtn.textContent = t(COPY.storyBottomCtaButton, lang);
  startBtn.addEventListener('click', callbacks.onFocusExploreTop);

  const teacherBtn = document.createElement('button');
  teacherBtn.type = 'button';
  teacherBtn.className = `btn-secondary ${isUr ? 'urdu-inline' : ''}`;
  teacherBtn.textContent = t(COPY.storyTeacherCtaButton, lang);
  teacherBtn.addEventListener('click', callbacks.onOpenTeacherView);

  bottomActions.append(startBtn, teacherBtn);
  bottomCard.append(bottomIcon, bottomHeading, bottomActions);
  section.appendChild(bottomCard);

  // Smooth Intersection + Scroll Parallax Choreography (respecting prefers-reduced-motion)
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  const chapters = Array.from(
    section.querySelectorAll<HTMLElement>('.scroll-chapter'),
  );

  let observer: IntersectionObserver | null = null;
  const onScrollParallax = () => {
    if (reducedMotion) return;
    const slowCard = section.querySelector<HTMLElement>('.parallax-float-slow');
    const midCard = section.querySelector<HTMLElement>('.parallax-float-mid');
    if (!slowCard || !midCard) return;

    const rect = ch1Visual.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);
    const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
    slowCard.style.transform = `translateY(${(20 + centerOffset * 18).toFixed(1)}px) rotate(-6deg)`;
    midCard.style.transform = `translateY(${(-12 - centerOffset * 22).toFixed(1)}px) rotate(3deg)`;
  };

  if (!reducedMotion && 'IntersectionObserver' in window) {
    chapters.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
    });

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power2.out',
              clearProps: 'transform',
            });
            observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    chapters.forEach((el) => observer?.observe(el));
    window.addEventListener('scroll', onScrollParallax, { passive: true });
  }

  return {
    element: section,
    cleanup: () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScrollParallax);
    },
  };
}

