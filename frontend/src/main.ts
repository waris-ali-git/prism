import "./styles/main.css";
import { AuthModal } from "./ui/authModal";
import { logoutUser } from "./app/firebase";

const appEl = document.querySelector<HTMLDivElement>("#app")!;

// Top bar and initial shell layout
appEl.innerHTML = `
  <header class="w-full h-16 border-b border-border-soft px-4 sm:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-accent">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polygon points="12 2 22 20 2 20" stroke="currentColor" fill="none" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <div class="flex items-baseline gap-2">
          <span class="text-xl font-extrabold text-ink tracking-tight">Prism</span>
          <span class="urdu-text text-sm text-accent-deep" style="line-height: 1;">منشور</span>
        </div>
        <p class="text-[10px] text-ink-muted -mt-0.5 tracking-wide">3D Science Museum</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Language selector -->
      <button id="lang-toggle-btn" class="px-3 py-1.5 rounded-full border border-border-soft text-xs font-bold text-ink-muted hover:text-ink hover:bg-surface-tint transition-all flex items-center gap-1.5">
        <span class="text-accent font-extrabold">EN</span>
        <span class="text-ink-faint">|</span>
        <span class="urdu-text text-xs" style="line-height: 1;">اردو</span>
      </button>

      <!-- Auth profile / sign in button -->
      <div id="auth-header-container">
        <button id="header-signin-btn" class="px-4 py-1.5 rounded-full bg-accent hover:bg-accent-deep text-white text-xs font-bold shadow-soft transition-all active:scale-95 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span>Sign In / لاگ ان</span>
        </button>
      </div>
    </div>
  </header>

  <main id="stage-container" class="relative flex-1 w-full flex flex-col items-center justify-center p-6 bg-white overflow-hidden">
    <!-- Hero / Stage content placeholder -->
    <div class="text-center max-w-md mx-auto z-10">
      <div class="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-surface-tint border border-border-soft shadow-soft">
        <span class="text-xs font-bold text-accent px-2 py-0.5">Firebase Connected</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-2">
        Explore Science in 3D
      </h1>
      <p class="urdu-text text-lg text-accent-deep mb-4" style="line-height: 2;">
        سائنس اور فلکیات کے تصورات کو سہ ابعادی انداز میں سمجھیں
      </p>
      <p class="text-sm text-ink-muted mb-6">
        Discover human cells, light dispersion through prisms, and the solar system with real-time interactive simulations.
      </p>
    </div>
  </main>
`;

// Initialize Auth Modal
const authModal = new AuthModal();

const authContainer = document.querySelector("#auth-header-container")!;
const signinBtn = document.querySelector("#header-signin-btn") as HTMLButtonElement;

signinBtn?.addEventListener("click", () => {
  authModal.open("login");
});

// Listen for auth state changes to update the top bar
authModal.onAuth((user) => {
  if (user) {
    const displayName = user.displayName || user.email?.split("@")[0] || "Student";
    authContainer.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-tint border border-border-soft text-xs text-ink font-semibold">
          <div class="w-2 h-2 rounded-full bg-correct"></div>
          <span class="max-w-[100px] truncate">${displayName}</span>
        </div>
        <button id="header-logout-btn" title="Sign Out" class="p-1.5 rounded-full text-ink-muted hover:text-wrong hover:bg-red-50 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    `;
    document.querySelector("#header-logout-btn")?.addEventListener("click", async () => {
      await logoutUser();
    });
  } else {
    authContainer.innerHTML = `
      <button id="header-signin-btn" class="px-4 py-1.5 rounded-full bg-accent hover:bg-accent-deep text-white text-xs font-bold shadow-soft transition-all active:scale-95 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span>Sign In / لاگ ان</span>
      </button>
    `;
    document.querySelector("#header-signin-btn")?.addEventListener("click", () => {
      authModal.open("login");
    });
  }
});
