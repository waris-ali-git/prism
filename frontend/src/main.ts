import '@fontsource-variable/nunito/wght.css';
import '@fontsource/noto-nastaliq-urdu/400.css';
import '@fontsource/noto-nastaliq-urdu/700.css';
import './styles/base.css';

import { AppShell } from './ui/shell';

const rootEl = document.getElementById('app');

if (!rootEl) {
  throw new Error('Root #app element not found.');
}

new AppShell(rootEl);

