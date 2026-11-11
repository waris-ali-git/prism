import { postResult } from '../api/client';
import type { Language, Lesson } from '../api/types';
import { COPY, t } from '../app/i18n';
import { store } from '../app/store';

export interface QuizRuntimeState {
  lessonKey: string;
  currentIndex: number;
  selectedAnswers: Array<number | null>;
  finished: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

let quizState: QuizRuntimeState | null = null;

export function ensureQuizState(lesson: Lesson): QuizRuntimeState {
  if (!quizState || quizState.lessonKey !== lesson.topicKey) {
    quizState = {
      lessonKey: lesson.topicKey,
      currentIndex: 0,
      selectedAnswers: lesson.quiz.map(() => null),
      finished: false,
      saveStatus: 'idle',
    };
  }
  return quizState;
}

export function resetQuizForLesson(lesson: Lesson): void {
  quizState = {
    lessonKey: lesson.topicKey,
    currentIndex: 0,
    selectedAnswers: lesson.quiz.map(() => null),
    finished: false,
    saveStatus: 'idle',
  };
}

export function renderQuizView(
  container: HTMLElement,
  lesson: Lesson,
  lang: Language,
  nickname: string,
  onRerender: () => void,
): void {
  const qs = ensureQuizState(lesson);
  const total = lesson.quiz.length;
  const isUr = lang === 'ur';

  container.innerHTML = '';

  if (total === 0) return;

  if (qs.finished) {
    let score = 0;
    lesson.quiz.forEach((q, idx) => {
      if (qs.selectedAnswers[idx] === q.answer) score += 1;
    });

    const wrap = document.createElement('div');
    wrap.className = 'space-y-5';

    // Calm crystal score card (no confetti or gimmicks — F9)
    const scoreCard = document.createElement('div');
    scoreCard.className =
      'rounded-[22px] p-5 bg-[#F7F6FD]/90 border border-[rgba(111,100,196,0.16)] space-y-3';

    const scoreNum = document.createElement('div');
    scoreNum.className =
      'text-3xl font-extrabold text-[#2B2A3A] tracking-tight';
    scoreNum.textContent = `${score} / ${total}`;

    const scoreMsg = document.createElement('p');
    scoreMsg.className = `text-sm text-[#6B6A80] ${isUr ? 'urdu-text' : ''}`;
    scoreMsg.setAttribute('lang', lang);
    scoreMsg.textContent =
      score === total
        ? t(COPY.quizPerfect, lang)
        : t(COPY.quizMissedHeading, lang);

    scoreCard.append(scoreNum, scoreMsg);
    wrap.appendChild(scoreCard);

    // Optional nickname + save to teacher dashboard — F9
    const saveBox = document.createElement('div');
    saveBox.className =
      'rounded-[20px] p-4 bg-white/80 border border-[rgba(111,100,196,0.14)] space-y-3';

    const nickLabel = document.createElement('label');
    nickLabel.className = `block text-sm font-semibold text-[#2B2A3A] ${isUr ? 'urdu-text' : ''}`;
    nickLabel.setAttribute('lang', lang);
    nickLabel.textContent = t(COPY.quizNicknameLabel, lang);

    const nickInput = document.createElement('input');
    nickInput.type = 'text';
    nickInput.maxLength = 24;
    nickInput.value = nickname;
    nickInput.placeholder = isUr ? 'مثلاً علی یا عائشہ' : 'e.g. Aisha';
    nickInput.className =
      'w-full min-h-[44px] px-3.5 rounded-[14px] bg-[#F7F6FD] border border-[rgba(111,100,196,0.18)] text-[#2B2A3A] text-sm';
    nickInput.addEventListener('input', () => {
      store.setState({ nickname: nickInput.value.slice(0, 24) });
    });

    const privNote = document.createElement('p');
    privNote.className = `text-xs text-[#6B6A80] ${isUr ? 'urdu-text' : ''}`;
    privNote.setAttribute('lang', lang);
    privNote.textContent = t(COPY.quizPrivacyNote, lang);

    saveBox.append(nickLabel, nickInput, privNote);

    if (qs.saveStatus === 'saved') {
      const okMsg = document.createElement('p');
      okMsg.className = `text-sm font-semibold text-[#6E64C4] ${isUr ? 'urdu-text' : ''}`;
      okMsg.setAttribute('lang', lang);
      okMsg.textContent = t(COPY.quizSaved, lang);
      saveBox.appendChild(okMsg);
    } else {
      if (qs.saveStatus === 'error') {
        const errMsg = document.createElement('p');
        errMsg.className = `text-xs text-[#9F4A6E] ${isUr ? 'urdu-text' : ''}`;
        errMsg.setAttribute('lang', lang);
        errMsg.textContent = t(COPY.quizSaveFailed, lang);
        saveBox.appendChild(errMsg);
      }

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = `btn-primary w-full ${isUr ? 'urdu-inline' : ''}`;
      saveBtn.disabled = qs.saveStatus === 'saving';
      saveBtn.textContent = t(COPY.quizSaveScore, lang);
      saveBtn.addEventListener('click', async () => {
        qs.saveStatus = 'saving';
        onRerender();
        try {
          const cleanNick = store.getState().nickname.trim().slice(0, 24);
          await postResult({
            topicKey: lesson.topicKey,
            topic: lesson.topic,
            score,
            total,
            nickname: cleanNick || undefined,
          });
          qs.saveStatus = 'saved';
        } catch {
          qs.saveStatus = 'error';
        }
        onRerender();
      });
      saveBox.appendChild(saveBtn);
    }

    wrap.appendChild(saveBox);

    // Missed questions review — F9
    lesson.quiz.forEach((q, idx) => {
      const chosen = qs.selectedAnswers[idx];
      if (chosen === q.answer) return;

      const missCard = document.createElement('div');
      missCard.className =
        'rounded-[18px] p-4 bg-white/75 border border-[rgba(111,100,196,0.14)] space-y-2';

      const qTitle = document.createElement('p');
      qTitle.className = `text-sm font-bold text-[#2B2A3A] ${isUr ? 'urdu-text' : ''}`;
      qTitle.setAttribute('lang', lang);
      qTitle.textContent = t(q.q, lang);

      const rightOpt = q.options[q.answer];
      const rightText = document.createElement('p');
      rightText.className = `text-sm font-semibold text-[#3C7A62] ${isUr ? 'urdu-text' : ''}`;
      rightText.setAttribute('lang', lang);
      rightText.textContent = rightOpt ? `✓ ${t(rightOpt, lang)}` : '';

      const exp = document.createElement('p');
      exp.className = `text-xs text-[#6B6A80] ${isUr ? 'urdu-text' : ''}`;
      exp.setAttribute('lang', lang);
      exp.textContent = t(q.explain, lang);

      missCard.append(qTitle, rightText, exp);
      wrap.appendChild(missCard);
    });

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = `btn-secondary w-full ${isUr ? 'urdu-inline' : ''}`;
    retryBtn.textContent = t(COPY.quizRetry, lang);
    retryBtn.addEventListener('click', () => {
      resetQuizForLesson(lesson);
      onRerender();
    });
    wrap.appendChild(retryBtn);

    container.appendChild(wrap);
    return;
  }

  // Active question screen — F9
  const currentQ = lesson.quiz[qs.currentIndex];
  if (!currentQ) return;
  const chosenIdx = qs.selectedAnswers[qs.currentIndex] ?? null;
  const answered = chosenIdx !== null;

  const wrap = document.createElement('div');
  wrap.className = 'space-y-4';

  // Progress bar + counter
  const progRow = document.createElement('div');
  progRow.className = 'flex items-center justify-between gap-3';

  const progLabel = document.createElement('span');
  progLabel.className = `text-xs font-semibold text-[#6B6A80] ${isUr ? 'urdu-inline' : ''}`;
  progLabel.textContent = `${t(COPY.quizQuestionProgress, lang)} ${qs.currentIndex + 1} / ${total}`;

  const dots = document.createElement('div');
  dots.className = 'flex items-center gap-1.5';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.className = `h-2 rounded-full transition-all ${
      i === qs.currentIndex
        ? 'w-6 bg-[#8F86D6]'
        : qs.selectedAnswers[i] !== null
          ? 'w-2 bg-[#B5E8D2]'
          : 'w-2 bg-[#E6E4F6]'
    }`;
    dots.appendChild(dot);
  }
  progRow.append(progLabel, dots);
  wrap.appendChild(progRow);

  // Question prompt
  const promptEl = document.createElement('h3');
  promptEl.className = `font-bold text-[#2B2A3A] panel-scaled-copy ${isUr ? 'urdu-text' : 'leading-snug'}`;
  promptEl.setAttribute('lang', lang);
  promptEl.textContent = t(currentQ.q, lang);
  wrap.appendChild(promptEl);

  // 4 large options (>= 44px)
  const optsWrap = document.createElement('div');
  optsWrap.className = 'space-y-2.5';

  currentQ.options.forEach((opt, optIdx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.disabled = answered;

    let stateClasses =
      'bg-white/82 border-[rgba(111,100,196,0.16)] hover:bg-[#F7F6FD] hover:border-[#8F86D6] text-[#2B2A3A]';
    if (answered) {
      if (optIdx === currentQ.answer) {
        stateClasses =
          'bg-[#B5E8D2]/35 border-[#59A98A] text-[#234A3B] font-bold';
      } else if (optIdx === chosenIdx) {
        stateClasses =
          'bg-[#F6BFD3]/35 border-[#C97A96] text-[#5B2B3D]';
      } else {
        stateClasses =
          'bg-white/50 border-[rgba(111,100,196,0.1)] text-[#6B6A80] opacity-75';
      }
    }

    btn.className = `w-full min-h-[48px] px-4 py-2.5 rounded-[16px] border text-left transition-all cursor-pointer disabled:cursor-default ${stateClasses} ${
      isUr ? 'urdu-text text-right' : 'text-sm font-semibold'
    }`;
    btn.setAttribute('lang', lang);
    btn.textContent = t(opt, lang);

    btn.addEventListener('click', () => {
      qs.selectedAnswers[qs.currentIndex] = optIdx;
      onRerender();
    });

    optsWrap.appendChild(btn);
  });

  wrap.appendChild(optsWrap);

  // Instant explanation feedback + Next/Finish button
  if (answered) {
    const explainCard = document.createElement('div');
    explainCard.className =
      'rounded-[18px] p-3.5 bg-[#F7F6FD] border border-[rgba(111,100,196,0.16)]';
    const expP = document.createElement('p');
    expP.className = `text-sm text-[#2B2A3A] ${isUr ? 'urdu-text' : 'leading-relaxed'}`;
    expP.setAttribute('lang', lang);
    expP.textContent = t(currentQ.explain, lang);
    explainCard.appendChild(expP);
    wrap.appendChild(explainCard);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = `btn-primary w-full ${isUr ? 'urdu-inline' : ''}`;
    const isLast = qs.currentIndex >= total - 1;
    nextBtn.textContent = isLast
      ? t(COPY.quizFinish, lang)
      : t(COPY.quizNext, lang);
    nextBtn.addEventListener('click', () => {
      if (isLast) {
        qs.finished = true;
      } else {
        qs.currentIndex += 1;
      }
      onRerender();
    });
    wrap.appendChild(nextBtn);
  }

  container.appendChild(wrap);
}

