import { ApiError } from '../api/client';
import { prepareTextbookImage, revokePreviewUrl } from '../api/image';
import { COPY, getErrorCopy, t } from '../app/i18n';
import { store, type AppState } from '../app/store';
import { ICONS } from './icons';

export function renderPhotoModal(
  container: HTMLElement,
  state: AppState,
  onUsePhoto: () => void,
): void {
  container.innerHTML = '';
  if (!state.photoModalOpen) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  const { lang, photoDraft } = state;
  const isUr = lang === 'ur';

  const backdrop = document.createElement('div');
  backdrop.className =
    'fixed inset-0 z-50 bg-[#2B2A3A]/20 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-5';

  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.className =
    'crystal-surface-strong w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 space-y-5';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between gap-3';

  const title = document.createElement('h2');
  title.className = `text-lg font-extrabold text-[#2B2A3A] ${
    isUr ? 'urdu-text' : ''
  }`;
  title.setAttribute('lang', lang);
  title.textContent = t(COPY.photoSheetTitle, lang);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn-icon';
  closeBtn.setAttribute('aria-label', t(COPY.cancelButton, lang));
  closeBtn.innerHTML = ICONS.close;
  closeBtn.addEventListener('click', () => {
    if (store.getState().photoDraft) {
      revokePreviewUrl(store.getState().photoDraft?.previewUrl);
    }
    store.setState({ photoModalOpen: false, photoDraft: null });
  });

  header.append(title, closeBtn);
  dialog.appendChild(header);

  const hint = document.createElement('p');
  hint.className = `text-sm text-[#6B6A80] ${isUr ? 'urdu-text' : 'leading-relaxed'}`;
  hint.setAttribute('lang', lang);
  hint.textContent = t(COPY.photoHint, lang);
  dialog.appendChild(hint);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png,image/webp';
  fileInput.setAttribute('capture', 'environment');
  fileInput.className = 'sr-only';

  const inlineError = document.createElement('p');
  inlineError.className = `text-sm font-semibold text-[#9F4A6E] hidden ${
    isUr ? 'urdu-text' : ''
  }`;
  inlineError.setAttribute('lang', lang);

  const handleSelectedFile = async (file: File | undefined) => {
    if (!file) return;
    inlineError.classList.add('hidden');
    try {
      const processed = await prepareTextbookImage(file);
      const prev = store.getState().photoDraft;
      if (prev) revokePreviewUrl(prev.previewUrl);
      store.setState({
        photoDraft: {
          previewUrl: processed.previewUrl,
          imageBase64: processed.imageBase64,
          mimeType: processed.mimeType,
          fileName: processed.fileName,
        },
      });
    } catch (err) {
      const code =
        err instanceof ApiError ? err.code : 'UNSUPPORTED_IMAGE';
      inlineError.textContent = getErrorCopy(code, lang);
      inlineError.classList.remove('hidden');
    }
  };

  fileInput.addEventListener('change', () => {
    void handleSelectedFile(fileInput.files?.[0]);
  });

  if (!photoDraft) {
    const dropZone = document.createElement('button');
    dropZone.type = 'button';
    dropZone.className =
      'w-full min-h-[170px] rounded-[22px] border-2 border-dashed border-[rgba(143,134,214,0.34)] bg-[#F7F6FD]/80 hover:bg-[#F7F6FD] flex flex-col items-center justify-center gap-3 p-6 cursor-pointer transition-colors';
    dropZone.innerHTML = `
      <span class="w-12 h-12 rounded-full bg-white border border-[rgba(111,100,196,0.16)] text-[#6E64C4] flex items-center justify-center shadow-sm">
        ${ICONS.camera}
      </span>
      <span class="text-sm font-bold text-[#2B2A3A] ${isUr ? 'urdu-inline' : ''}">
        ${t(COPY.photoChooseFile, lang)}
      </span>
    `;
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      void handleSelectedFile(e.dataTransfer?.files?.[0]);
    });
    dialog.appendChild(dropZone);
  } else {
    const previewWrap = document.createElement('div');
    previewWrap.className =
      'rounded-[20px] overflow-hidden border border-[rgba(111,100,196,0.18)] bg-[#F7F6FD] max-h-[260px] flex items-center justify-center';
    const img = document.createElement('img');
    img.src = photoDraft.previewUrl;
    img.alt = 'Selected textbook page preview';
    img.className = 'max-h-[256px] w-auto object-contain';
    previewWrap.appendChild(img);
    dialog.appendChild(previewWrap);

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-3';

    const retakeBtn = document.createElement('button');
    retakeBtn.type = 'button';
    retakeBtn.className = `btn-secondary flex-1 ${isUr ? 'urdu-inline' : ''}`;
    retakeBtn.textContent = t(COPY.photoRetake, lang);
    retakeBtn.addEventListener('click', () => {
      revokePreviewUrl(photoDraft.previewUrl);
      store.setState({ photoDraft: null });
      fileInput.click();
    });

    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.className = `btn-primary flex-1 ${isUr ? 'urdu-inline' : ''}`;
    useBtn.textContent = t(COPY.photoUseThis, lang);
    useBtn.addEventListener('click', onUsePhoto);

    actions.append(retakeBtn, useBtn);
    dialog.appendChild(actions);
  }

  dialog.append(inlineError, fileInput);
  backdrop.appendChild(dialog);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeBtn.click();
    }
  });

  container.appendChild(backdrop);
}

