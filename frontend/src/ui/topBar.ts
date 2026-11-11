import type { TextScale } from '../api/types';
import { APP_NAME } from '../app/constants';
import { COPY, t } from '../app/i18n';
import { navigateTo } from '../app/router';
import { store, type AppState } from '../app/store';
import { ICONS } from './icons';

export function renderTopBar(
  container: HTMLElement,
  state: AppState,
  onReturnHomeIdle: () => void,
): void {
  const { lang, route, textScale } = state;
  const isUr = lang === 'ur';

  container.innerHTML = '';

  const bar = document.createElement('header');
  bar.className =
    'fixed top-0 inset-x-0 z-40 px-3 sm:px-6 pt-3 pb-2 pointer-events-none';

  const inner = document.createElement('div');
  inner.className =
    'max-w-7xl mx-auto flex items-center justify-between gap-2 pointer-events-auto';

  // Brand crystal pill
  const brandBtn = document.createElement('button');
  brandBtn.type = 'button';
  brandBtn.className =
    'crystal-surface min-h-[46px] pl-3 pr-4 rounded-full flex items-center gap-2.5 cursor-pointer hover:border-[#8F86D6]/40 transition-colors';
  brandBtn.innerHTML = `
    ${ICONS.prismLogo}
    <span class="font-extrabold text-lg tracking-tight text-[#2B2A3A]">${APP_NAME}</span>
  `;
  brandBtn.addEventListener('click', () => {
    if (route !== '/') {
      navigateTo('/');
    } else {
      onReturnHomeIdle();
    }
  });

  // Right controls cluster
  const rightCluster = document.createElement('div');
  rightCluster.className = 'flex items-center gap-1.5 sm:gap-2.5';

  // Route switcher pill (Explore / Teacher view)
  const navGroup = document.createElement('nav');
  navGroup.setAttribute('aria-label', 'Main navigation');
  navGroup.className =
    'crystal-surface p-1 rounded-full flex items-center gap-0.5';

  const expBtn = document.createElement('button');
  expBtn.type = 'button';
  expBtn.className = `min-h-[36px] px-3 sm:px-3.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all ${
    route === '/'
      ? 'bg-[#8F86D6] text-white shadow-sm'
      : 'text-[#6B6A80] hover:text-[#2B2A3A]'
  } ${isUr ? 'urdu-inline' : ''}`;
  expBtn.textContent = t(COPY.navExplore, lang);
  expBtn.addEventListener('click', () => navigateTo('/'));

  const teachBtn = document.createElement('button');
  teachBtn.type = 'button';
  teachBtn.className = `min-h-[36px] px-3 sm:px-3.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all ${
    route === '/teacher'
      ? 'bg-[#8F86D6] text-white shadow-sm'
      : 'text-[#6B6A80] hover:text-[#2B2A3A]'
  } ${isUr ? 'urdu-inline' : ''}`;
  teachBtn.textContent = t(COPY.navTeacher, lang);
  teachBtn.addEventListener('click', () => navigateTo('/teacher'));

  navGroup.append(expBtn, teachBtn);

  // 3-step Text Size control — F1 & F6
  const scaleBtn = document.createElement('button');
  scaleBtn.type = 'button';
  scaleBtn.className =
    'crystal-surface min-w-[44px] min-h-[44px] px-2.5 rounded-full flex items-center justify-center gap-0.5 text-[#6E64C4] font-extrabold text-xs cursor-pointer hover:bg-[#F7F6FD] transition-colors';
  scaleBtn.title = `${t(COPY.textSizeLabel, lang)} (${textScale}/3)`;
  scaleBtn.setAttribute(
    'aria-label',
    `${t(COPY.textSizeLabel, lang)}: step ${textScale} of 3`,
  );
  scaleBtn.innerHTML = `
    <span class="${textScale === 1 ? 'opacity-100' : 'opacity-45'} text-[11px]">A</span>
    <span class="${textScale === 2 ? 'opacity-100' : 'opacity-45'} text-[13px]">A</span>
    <span class="${textScale === 3 ? 'opacity-100' : 'opacity-45'} text-[15px]">A</span>
  `;
  scaleBtn.addEventListener('click', () => {
    const nextScale: TextScale =
      textScale === 1 ? 2 : textScale === 2 ? 3 : 1;
    document.documentElement.setAttribute('data-text-scale', String(nextScale));
    store.setState({ textScale: nextScale });
  });

  // Bilingual toggle (English / اردو) — F6
  const langWrap = document.createElement('div');
  langWrap.className =
    'crystal-surface p-1 rounded-full flex items-center gap-0.5';
  langWrap.setAttribute('role', 'group');
  langWrap.setAttribute('aria-label', 'Language');

  const enBtn = document.createElement('button');
  enBtn.type = 'button';
  enBtn.className = `min-h-[36px] min-w-[44px] px-2.5 sm:px-3 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all ${
    lang === 'en'
      ? 'bg-[#8F86D6] text-white shadow-sm'
      : 'text-[#6B6A80] hover:text-[#2B2A3A]'
  }`;
  enBtn.textContent = 'English';
  enBtn.setAttribute('aria-pressed', String(lang === 'en'));

  const urBtn = document.createElement('button');
  urBtn.type = 'button';
  urBtn.lang = 'ur';
  urBtn.className = `min-h-[36px] min-w-[44px] px-2.5 sm:px-3 rounded-full text-sm font-bold urdu-inline cursor-pointer transition-all ${
    lang === 'ur'
      ? 'bg-[#8F86D6] text-white shadow-sm'
      : 'text-[#6B6A80] hover:text-[#2B2A3A]'
  }`;
  urBtn.textContent = 'اردو';
  urBtn.setAttribute('aria-pressed', String(lang === 'ur'));

  const switchLang = (target: 'en' | 'ur') => {
    if (store.getState().lang === target) return;
    document.body.classList.add('lang-switching');
    window.setTimeout(() => {
      store.setState({ lang: target });
      window.requestAnimationFrame(() => {
        document.body.classList.remove('lang-switching');
      });
    }, 90);
  };

  enBtn.addEventListener('click', () => switchLang('en'));
  urBtn.addEventListener('click', () => switchLang('ur'));

  langWrap.append(enBtn, urBtn);

  const gtHolder = document.createElement('div');
  gtHolder.id = 'google_translate_element';
  gtHolder.className = 'flex items-center';

  rightCluster.append(navGroup, scaleBtn, langWrap, gtHolder);

  if ((window as unknown as { google?: { translate?: { TranslateElement: unknown; InlineLayout?: { SIMPLE: unknown } } } }).google?.translate?.TranslateElement) {
    try {
      const g = (window as unknown as { google: { translate: { TranslateElement: new (cfg: unknown, id: string) => unknown; InlineLayout: { SIMPLE: unknown } } } }).google.translate;
      new g.TranslateElement(
        { pageLanguage: 'en', layout: g.InlineLayout.SIMPLE, autoDisplay: false },
        'google_translate_element',
      );
    } catch {
      // safe fallback
    }
  }
  inner.append(brandBtn, rightCluster);
  bar.appendChild(inner);
  container.appendChild(bar);
}

