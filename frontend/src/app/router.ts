export type AppRoute = '/' | '/teacher';

export function readCurrentRoute(): AppRoute {
  const hash = window.location.hash.replace(/^#/, '').trim();
  if (hash === '/teacher' || hash.startsWith('/teacher?')) {
    return '/teacher';
  }
  return '/';
}

export function navigateTo(route: AppRoute): void {
  const targetHash = `#${route}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

export function onRouteChange(listener: (route: AppRoute) => void): () => void {
  const handler = () => listener(readCurrentRoute());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

