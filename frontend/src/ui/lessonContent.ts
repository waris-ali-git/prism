import type { Lesson } from '../api/types';
import { COPY, t } from '../app/i18n';
import { store, type AppState } from '../app/store';
import { renderQuizView } from './quiz';

export interface LessonPanelActions {
  onSelectPart: (partId: string | null) => void;
  onControlChange: (controlId: string, value: number) => void;
  onRerenderQuiz: () => void;
}

export function renderLessonContent(
  container: HTMLElement,
  lesson: Lesson,
  state: AppState,
  actions: LessonPanelActions,
): void {
  const { lang, selectedPartId, panelTab, controlValues, nickname } = state;
  const isUr = lang === 'ur';

  container.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'space-y-5 lang-fade';

  // Lesson Header
  const header = document.createElement('div');
  header.className = `space-y-1.5 ${isUr ? 'text-right' : ''}`;

  const titleEl = document.createElement('h1');
  titleEl.className = `text-xl sm:text-2xl font-extrabold text-[#2B2A3A] ${
    isUr ? 'urdu-text' : 'leading-tight'
  }`;
  titleEl.setAttribute('lang', lang);
  titleEl.textContent = t(lesson.title, lang);
  header.appendChild(titleEl);
  root.appendChild(header);

  // Segmented switcher: Lesson vs Quiz
  const tabBar = document.createElement('div');
  tabBar.className =
    'p-1 rounded-full bg-[#F7F6FD] border border-[rgba(111,100,196,0.14)] grid grid-cols-2 gap-1';

  const expTab = document.createElement('button');
  expTab.type = 'button';
  expTab.className = `min-h-[40px] rounded-full text-sm font-bold cursor-pointer transition-all ${
    panelTab === 'explore'
      ? 'bg-white text-[#6E64C4] shadow-sm border border-[rgba(111,100,196,0.14)]'
      : 'text-[#6B6A80] hover:text-[#2B2A3A]'
  } ${isUr ? 'urdu-inline' : ''}`;
  expTab.textContent = t(COPY.tabExplore, lang);
  expTab.addEventListener('click', () => store.setState({ panelTab: 'explore' }));

  const quizTab = document.createElement('button');
  quizTab.type = 'button';
  quizTab.className = `min-h-[40px] rounded-full text-sm font-bold cursor-pointer transition-all ${
    panelTab === 'quiz'
      ? 'bg-white text-[#6E64C4] shadow-sm border border-[rgba(111,100,196,0.14)]'
      : 'text-[#6B6A80] hover:text-[#2B2A3A]'
  } ${isUr ? 'urdu-inline' : ''}`;
  quizTab.textContent = `${t(COPY.tabQuiz, lang)} (${lesson.quiz.length})`;
  quizTab.addEventListener('click', () => store.setState({ panelTab: 'quiz' }));

  tabBar.append(expTab, quizTab);
  root.appendChild(tabBar);

  if (panelTab === 'quiz') {
    const quizBox = document.createElement('div');
    renderQuizView(quizBox, lesson, lang, nickname, actions.onRerenderQuiz);
    root.appendChild(quizBox);
  } else {
    // Explanation card (Overview when no part selected, or selected Part explanation) — F6
    const selectedPart = selectedPartId
      ? lesson.parts.find((p) => p.id === selectedPartId) ?? null
      : null;

    const infoCard = document.createElement('div');
    infoCard.className =
      'rounded-[22px] p-4 sm:p-5 bg-white/85 border border-[rgba(111,100,196,0.15)] space-y-2.5';

    if (selectedPart) {
      const partHead = document.createElement('div');
      partHead.className = `flex items-center gap-2.5 ${
        isUr ? 'flex-row-reverse' : ''
      }`;

      const swatch = document.createElement('span');
      swatch.className =
        'w-3.5 h-3.5 rounded-full shrink-0 border border-black/10';
      swatch.style.backgroundColor = selectedPart.color;

      const pName = document.createElement('h2');
      pName.className = `font-extrabold text-lg text-[#2B2A3A] ${
        isUr ? 'urdu-text' : ''
      }`;
      pName.setAttribute('lang', lang);
      pName.textContent = t(selectedPart.name, lang);

      partHead.append(swatch, pName);

      const pExplain = document.createElement('p');
      pExplain.className = `text-[#2B2A3A] panel-scaled-copy ${
        isUr ? 'urdu-text' : 'leading-relaxed'
      }`;
      pExplain.setAttribute('lang', lang);
      pExplain.textContent = t(selectedPart.explain, lang);

      infoCard.append(partHead, pExplain);
    } else {
      const sumP = document.createElement('p');
      sumP.className = `text-[#2B2A3A] panel-scaled-copy ${
        isUr ? 'urdu-text' : 'leading-relaxed'
      }`;
      sumP.setAttribute('lang', lang);
      sumP.textContent = t(lesson.summary, lang);

      const hintP = document.createElement('p');
      hintP.className = `text-xs text-[#6B6A80] pt-1 ${
        isUr ? 'urdu-text' : ''
      }`;
      hintP.setAttribute('lang', lang);
      hintP.textContent = t(COPY.selectPartPrompt, lang);

      infoCard.append(sumP, hintP);
    }

    root.appendChild(infoCard);

    // Accessible Parts List (every 3D label exists as plain focusable button — F5 & F12)
    const partsSec = document.createElement('div');
    partsSec.className = 'space-y-2.5';

    const partsLabel = document.createElement('h3');
    partsLabel.className = `text-sm font-bold text-[#6B6A80] ${
      isUr ? 'urdu-text' : ''
    }`;
    partsLabel.setAttribute('lang', lang);
    partsLabel.textContent = t(COPY.partsHeading, lang);
    partsSec.appendChild(partsLabel);

    const chipsWrap = document.createElement('div');
    chipsWrap.className = `flex flex-wrap gap-2 ${
      isUr ? 'flex-row-reverse' : ''
    }`;

    const overviewChip = document.createElement('button');
    overviewChip.type = 'button';
    overviewChip.className = `crystal-chip text-xs ${
      selectedPartId === null ? 'is-active' : ''
    } ${isUr ? 'urdu-inline' : ''}`;
    overviewChip.setAttribute('aria-pressed', String(selectedPartId === null));
    overviewChip.textContent = t(COPY.allOverview, lang);
    overviewChip.addEventListener('click', () => actions.onSelectPart(null));
    chipsWrap.appendChild(overviewChip);

    for (const part of lesson.parts) {
      const active = part.id === selectedPartId;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `crystal-chip text-xs ${active ? 'is-active' : ''} ${
        isUr ? 'urdu-inline flex-row-reverse' : ''
      }`;
      chip.setAttribute('aria-pressed', String(active));

      const dot = document.createElement('span');
      dot.className = 'w-2.5 h-2.5 rounded-full shrink-0 border border-black/10';
      dot.style.backgroundColor = part.color;

      const lbl = document.createElement('span');
      lbl.setAttribute('lang', lang);
      lbl.textContent = t(part.name, lang);

      chip.append(dot, lbl);
      chip.addEventListener('click', () => actions.onSelectPart(part.id));
      chipsWrap.appendChild(chip);
    }

    partsSec.appendChild(chipsWrap);
    root.appendChild(partsSec);

    // Interactive Sliders — F7
    if (lesson.controls.length > 0) {
      const ctrlSec = document.createElement('div');
      ctrlSec.className =
        'rounded-[22px] p-4 bg-[#F7F6FD]/90 border border-[rgba(111,100,196,0.14)] space-y-3.5';

      const ctrlHeading = document.createElement('h3');
      ctrlHeading.className = `text-sm font-bold text-[#2B2A3A] ${
        isUr ? 'urdu-text' : ''
      }`;
      ctrlHeading.setAttribute('lang', lang);
      ctrlHeading.textContent = t(COPY.controlsHeading, lang);
      ctrlSec.appendChild(ctrlHeading);

      for (const ctrl of lesson.controls) {
        const val = controlValues[ctrl.id] ?? ctrl.default;
        const row = document.createElement('div');
        row.className = 'space-y-1';

        const topRow = document.createElement('div');
        topRow.className = `flex items-center justify-between gap-2 ${
          isUr ? 'flex-row-reverse' : ''
        }`;

        const lbl = document.createElement('label');
        const inputId = `ctrl-slider-${ctrl.id}`;
        lbl.htmlFor = inputId;
        lbl.className = `text-sm font-semibold text-[#2B2A3A] ${
          isUr ? 'urdu-inline' : ''
        }`;
        lbl.setAttribute('lang', lang);
        lbl.textContent = t(ctrl.label, lang);

        const readout = document.createElement('span');
        readout.className =
          'text-xs font-bold text-[#6E64C4] px-2.5 py-0.5 rounded-full bg-white border border-[rgba(111,100,196,0.14)]';
        const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1);
        readout.textContent = ctrl.unit ? `${formatted} ${ctrl.unit}` : formatted;

        topRow.append(lbl, readout);

        const range = document.createElement('input');
        range.id = inputId;
        range.type = 'range';
        range.min = String(ctrl.min);
        range.max = String(ctrl.max);
        range.step = String(ctrl.step ?? (ctrl.max - ctrl.min) / 40);
        range.value = String(val);
        range.className = 'prism-slider';

        range.addEventListener('input', () => {
          const nextNum = Number(range.value);
          const disp = Number.isInteger(nextNum)
            ? String(nextNum)
            : nextNum.toFixed(1);
          readout.textContent = ctrl.unit ? `${disp} ${ctrl.unit}` : disp;
          actions.onControlChange(ctrl.id, nextNum);
        });

        row.append(topRow, range);
        ctrlSec.appendChild(row);
      }

      root.appendChild(ctrlSec);
    }
  }

  // Always-visible Responsible AI Footer — Section 9.6 & 11
  const footer = document.createElement('footer');
  footer.className =
    'pt-3 border-t border-[rgba(111,100,196,0.14)] text-xs text-[#6B6A80]';
  const footP = document.createElement('p');
  footP.className = isUr ? 'urdu-text text-xs' : 'leading-relaxed';
  footP.setAttribute('lang', lang);
  footP.textContent = t(COPY.aiFooter, lang);
  footer.appendChild(footP);
  root.appendChild(footer);

  container.appendChild(root);
}

