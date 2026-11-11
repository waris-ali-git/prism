import { ApiError, getStats } from '../api/client';
import type { Language, TopicStat } from '../api/types';
import { COPY, getErrorCopy, t } from '../app/i18n';
import { navigateTo } from '../app/router';
import { ICONS } from './icons';

export class TeacherDashboardView {
  private container: HTMLElement;
  private onOpenTopic: (topic: string) => void;
  private loading = false;
  private errorCode: ApiError['code'] | null = null;
  private topics: TopicStat[] = [];
  private autoRefresh = false;
  private timerId: number | null = null;
  private lang: Language = 'en';

  constructor(container: HTMLElement, onOpenTopic: (topic: string) => void) {
    this.container = container;
    this.onOpenTopic = onOpenTopic;
  }

  mount(lang: Language): void {
    this.lang = lang;
    void this.fetchStats();
  }

  setLanguage(lang: Language): void {
    this.lang = lang;
    this.render();
  }

  unmount(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      void this.fetchStats(true);
    }, 15_000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private async fetchStats(silent = false): Promise<void> {
    if (!silent) {
      this.loading = true;
      this.errorCode = null;
      this.render();
    }

    try {
      const res = await getStats();
      this.topics = res.topics;
      this.errorCode = null;
    } catch (err) {
      this.errorCode = err instanceof ApiError ? err.code : 'NETWORK_ERROR';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private render(): void {
    const isUr = this.lang === 'ur';
    this.container.innerHTML = '';

    const page = document.createElement('main');
    page.className =
      'relative z-10 min-h-dvh pt-24 pb-20 px-4 sm:px-8 max-w-5xl mx-auto space-y-8 lang-fade';

    // Header bar
    const topWrap = document.createElement('div');
    topWrap.className = `flex flex-col md:flex-row md:items-end justify-between gap-5 ${
      isUr ? 'md:flex-row-reverse text-right' : ''
    }`;

    const titleGroup = document.createElement('div');
    titleGroup.className = 'space-y-2 max-w-2xl';

    const h1 = document.createElement('h1');
    h1.className = `text-2xl sm:text-3xl font-extrabold text-[#2B2A3A] tracking-tight ${
      isUr ? 'urdu-text' : ''
    }`;
    h1.setAttribute('lang', this.lang);
    h1.textContent = t(COPY.dashboardTitle, this.lang);

    const sub = document.createElement('p');
    sub.className = `text-sm sm:text-base text-[#6B6A80] ${
      isUr ? 'urdu-text' : 'leading-relaxed'
    }`;
    sub.setAttribute('lang', this.lang);
    sub.textContent = t(COPY.dashboardSubtitle, this.lang);

    titleGroup.append(h1, sub);

    const controls = document.createElement('div');
    controls.className = 'flex flex-wrap items-center gap-2.5';

    const autoBtn = document.createElement('button');
    autoBtn.type = 'button';
    autoBtn.className = `crystal-chip text-xs ${
      this.autoRefresh ? 'is-active' : ''
    } ${isUr ? 'urdu-inline' : ''}`;
    autoBtn.setAttribute('aria-pressed', String(this.autoRefresh));
    autoBtn.textContent = t(COPY.dashboardAutoRefresh, this.lang);
    autoBtn.addEventListener('click', () => {
      this.autoRefresh = !this.autoRefresh;
      if (this.autoRefresh) this.startTimer();
      else this.stopTimer();
      this.render();
    });

    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = `btn-secondary text-sm ${isUr ? 'urdu-inline' : ''}`;
    refreshBtn.disabled = this.loading;
    refreshBtn.innerHTML = `
      ${ICONS.refresh}
      <span>${t(COPY.dashboardRefresh, this.lang)}</span>
    `;
    refreshBtn.addEventListener('click', () => void this.fetchStats());

    controls.append(autoBtn, refreshBtn);
    topWrap.append(titleGroup, controls);
    page.appendChild(topWrap);

    const divider = document.createElement('div');
    divider.className = 'spectral-hairline';
    page.appendChild(divider);

    // Content states: Loading / Error / Empty / Populated (Rule R1: never fake rows)
    if (this.loading) {
      const skel = document.createElement('div');
      skel.className =
        'crystal-surface rounded-[28px] p-10 text-center space-y-4';
      skel.innerHTML = `
        <div class="w-10 h-10 rounded-full border-2 border-[#8F86D6]/30 border-t-[#8F86D6] animate-spin mx-auto"></div>
      `;
      page.appendChild(skel);
    } else if (this.errorCode) {
      const errCard = document.createElement('div');
      errCard.className =
        'crystal-surface-strong rounded-[28px] p-8 sm:p-11 text-center max-w-xl mx-auto space-y-5';

      const msg = document.createElement('p');
      msg.className = `text-base font-semibold text-[#2B2A3A] ${
        isUr ? 'urdu-text text-center' : 'leading-relaxed'
      }`;
      msg.setAttribute('lang', this.lang);
      msg.textContent = getErrorCopy(this.errorCode, this.lang);

      const actRow = document.createElement('div');
      actRow.className = 'flex flex-wrap items-center justify-center gap-3';

      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = `btn-primary ${isUr ? 'urdu-inline' : ''}`;
      retry.textContent = t(COPY.tryAgain, this.lang);
      retry.addEventListener('click', () => void this.fetchStats());

      const back = document.createElement('button');
      back.type = 'button';
      back.className = `btn-secondary ${isUr ? 'urdu-inline' : ''}`;
      back.textContent = t(COPY.backToExplore, this.lang);
      back.addEventListener('click', () => navigateTo('/'));

      actRow.append(retry, back);
      errCard.append(msg, actRow);
      page.appendChild(errCard);
    } else if (this.topics.length === 0) {
      // Intentional museum-calm Empty State — Section 9.6 & F10
      const emptyCard = document.createElement('div');
      emptyCard.className =
        'crystal-surface-strong rounded-[28px] p-9 sm:p-12 text-center max-w-xl mx-auto space-y-5';

      const emblem = document.createElement('div');
      emblem.className =
        'w-14 h-14 rounded-full bg-[#F7F6FD] border border-[rgba(111,100,196,0.16)] flex items-center justify-center mx-auto';
      emblem.innerHTML = ICONS.prismLogo;

      const emptyP = document.createElement('p');
      emptyP.className = `text-base text-[#2B2A3A] font-semibold ${
        isUr ? 'urdu-text text-center' : 'leading-relaxed'
      }`;
      emptyP.setAttribute('lang', this.lang);
      emptyP.textContent = t(COPY.dashboardEmpty, this.lang);

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = `btn-primary ${isUr ? 'urdu-inline' : ''}`;
      backBtn.textContent = t(COPY.backToExplore, this.lang);
      backBtn.addEventListener('click', () => navigateTo('/'));

      emptyCard.append(emblem, emptyP, backBtn);
      page.appendChild(emptyCard);
    } else {
      // Real populated rows sorted weakest first — F10
      const list = document.createElement('div');
      list.className = 'space-y-3.5';

      for (const item of this.topics) {
        const pct = Math.max(0, Math.min(100, item.avgPercent));
        const barColor =
          pct < 50
            ? '#F6BFD3'
            : pct < 75
              ? '#FFCDB8'
              : '#B5E8D2';

        const row = document.createElement('div');
        row.className =
          'crystal-surface rounded-[22px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#8F86D6]/40 transition-colors';

        const left = document.createElement('div');
        left.className = 'flex-1 space-y-2.5';

        const headLine = document.createElement('div');
        headLine.className = 'flex items-center justify-between gap-3';

        const topicName = document.createElement('h2');
        topicName.className = 'text-base sm:text-lg font-extrabold text-[#2B2A3A]';
        topicName.textContent = item.topic;

        const pctBadge = document.createElement('span');
        pctBadge.className =
          'text-sm font-extrabold text-[#2B2A3A] px-3 py-0.5 rounded-full bg-[#F7F6FD] border border-[rgba(111,100,196,0.14)]';
        pctBadge.textContent = `${pct.toFixed(1)}%`;

        headLine.append(topicName, pctBadge);

        const track = document.createElement('div');
        track.className =
          'w-full h-2.5 rounded-full bg-[#F7F6FD] border border-[rgba(111,100,196,0.1)] overflow-hidden';
        const fill = document.createElement('div');
        fill.className = 'h-full rounded-full transition-all duration-500';
        fill.style.width = `${Math.max(4, pct)}%`;
        fill.style.backgroundColor = barColor;
        track.appendChild(fill);

        const metaRow = document.createElement('p');
        metaRow.className = 'text-xs text-[#6B6A80]';
        const dateText = formatShortDate(item.updatedAt);
        metaRow.textContent = `${item.attempts} ${t(COPY.dashboardAttempts, this.lang)} — ${dateText}`;

        left.append(headLine, track, metaRow);

        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = `btn-secondary shrink-0 ${
          isUr ? 'urdu-inline' : ''
        }`;
        openBtn.textContent = t(COPY.dashboardOpenLesson, this.lang);
        openBtn.addEventListener('click', () => {
          this.onOpenTopic(item.topic);
        });

        row.append(left, openBtn);
        list.appendChild(row);
      }

      page.appendChild(list);
    }

    this.container.appendChild(page);
  }
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

