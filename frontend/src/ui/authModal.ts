import {
  signUpWithEmail,
  loginWithEmail,
  loginWithGoogle,
  onAuthChange,
  getCurrentUser,
} from "../app/firebase";
import type { User } from "firebase/auth";

type AuthMode = "login" | "signup";

export class AuthModal {
  private container: HTMLElement;
  private mode: AuthMode = "login";
  private isOpen = false;
  private onUserChangeCallbacks: Array<(user: User | null) => void> = [];

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "prism-auth-modal";
    this.container.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300";
    document.body.appendChild(this.container);

    this.render();
    this.bindEvents();

    onAuthChange((user) => {
      this.notifyUserChange(user);
    });
  }

  public open(mode: AuthMode = "login") {
    this.mode = mode;
    this.isOpen = true;
    this.render();
    this.container.classList.remove("opacity-0", "pointer-events-none");
    this.container.classList.add("opacity-100");
  }

  public close() {
    this.isOpen = false;
    this.container.classList.remove("opacity-100");
    this.container.classList.add("opacity-0", "pointer-events-none");
  }

  public onAuth(callback: (user: User | null) => void) {
    this.onUserChangeCallbacks.push(callback);
    callback(getCurrentUser());
  }

  private notifyUserChange(user: User | null) {
    this.onUserChangeCallbacks.forEach((cb) => cb(user));
  }

  private render() {
    const isLogin = this.mode === "login";

    this.container.innerHTML = `
      <div class="relative w-full max-w-md bg-white rounded-3xl p-7 shadow-modal border border-primary/20 overflow-hidden transform scale-95 transition-transform duration-300" id="auth-dialog">
        <!-- Close button -->
        <button id="auth-close-btn" class="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-tint transition-colors" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Brand / Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 22 20 2 20" stroke="currentColor" fill="none" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="text-2xl font-extrabold text-ink tracking-tight">
            ${isLogin ? "Welcome to Prism" : "Create Prism Account"}
          </h2>
          <p class="text-sm text-ink-muted mt-1">
            ${isLogin ? "Sign in to save quizzes & explore 3D lessons" : "Join interactive 3D science simulations"}
          </p>
          <p class="urdu-text text-xs text-primary mt-1" style="line-height: 1.8;">
            ${isLogin ? "سائنس کی انٹرایکٹو دنیا میں لاگ ان کریں" : "نیا اکاؤنٹ بنائیں اور دریافت شروع کریں"}
          </p>
        </div>

        <!-- Mode switcher tabs -->
        <div class="flex p-1 bg-surface-tint rounded-xl mb-5">
          <button id="tab-login" class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}">
            Sign In / لاگ ان
          </button>
          <button id="tab-signup" class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}">
            Sign Up / سائن اپ
          </button>
        </div>

        <!-- Error feedback -->
        <div id="auth-error" class="hidden mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-wrong text-xs leading-relaxed font-medium"></div>

        <!-- Form -->
        <form id="auth-form" class="space-y-4">
          ${!isLogin ? `
            <div>
              <label class="block text-xs font-bold text-ink-muted mb-1">Full Name / نام</label>
              <input id="auth-name" type="text" required placeholder="e.g. Maria Khan" class="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium transition-all" />
            </div>
          ` : ""}

          <div>
            <label class="block text-xs font-bold text-ink-muted mb-1">Email / ای میل</label>
            <input id="auth-email" type="email" required placeholder="student@school.edu" class="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium transition-all" />
          </div>

          <div>
            <label class="block text-xs font-bold text-ink-muted mb-1">Password / پاس ورڈ</label>
            <input id="auth-pass" type="password" required minlength="6" placeholder="At least 6 characters" class="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium transition-all" />
          </div>

          <button id="auth-submit-btn" type="submit" class="w-full py-3 px-5 rounded-pill bg-accent hover:bg-accent-deep text-white font-bold text-sm shadow-soft transition-all duration-200 active:scale-[0.98] mt-2">
            ${isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div class="relative my-5">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-border-soft"></div></div>
          <div class="relative flex justify-center text-xs"><span class="px-3 bg-white text-ink-faint font-medium">or continue with</span></div>
        </div>

        <!-- Google Auth Button -->
        <button id="google-auth-btn" type="button" class="w-full py-2.5 px-4 rounded-pill border border-border-soft bg-white hover:bg-surface-tint text-ink text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    `;

    // Scale animation
    setTimeout(() => {
      const dialog = this.container.querySelector("#auth-dialog");
      if (dialog) dialog.classList.remove("scale-95");
    }, 10);
  }

  private bindEvents() {
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.id === "prism-auth-modal" || target.closest("#auth-close-btn")) {
        this.close();
      } else if (target.id === "tab-login" || target.closest("#tab-login")) {
        this.mode = "login";
        this.render();
      } else if (target.id === "tab-signup" || target.closest("#tab-signup")) {
        this.mode = "signup";
        this.render();
      }
    });

    this.container.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      if (form.id !== "auth-form") return;

      const emailInput = form.querySelector("#auth-email") as HTMLInputElement;
      const passInput = form.querySelector("#auth-pass") as HTMLInputElement;
      const nameInput = form.querySelector("#auth-name") as HTMLInputElement | null;
      const submitBtn = form.querySelector("#auth-submit-btn") as HTMLButtonElement;
      const errorDiv = this.container.querySelector("#auth-error") as HTMLDivElement;

      errorDiv.classList.add("hidden");
      submitBtn.disabled = true;
      submitBtn.innerText = "Please wait...";

      try {
        if (this.mode === "signup") {
          await signUpWithEmail(emailInput.value, passInput.value, nameInput?.value || "");
        } else {
          await loginWithEmail(emailInput.value, passInput.value);
        }
        this.close();
      } catch (err: any) {
        errorDiv.innerText = this.formatAuthError(err.message || err.code || "Authentication failed");
        errorDiv.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = this.mode === "login" ? "Sign In" : "Create Account";
      }
    });

    this.container.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const googleBtn = target.closest("#google-auth-btn");
      if (!googleBtn) return;

      const errorDiv = this.container.querySelector("#auth-error") as HTMLDivElement;
      errorDiv.classList.add("hidden");

      try {
        await loginWithGoogle();
        this.close();
      } catch (err: any) {
        errorDiv.innerText = this.formatAuthError(err.message || err.code || "Google sign in failed");
        errorDiv.classList.remove("hidden");
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  private formatAuthError(msg: string): string {
    if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
      return "Incorrect email or password. Please try again. / غلط پاس ورڈ یا ای میل";
    }
    if (msg.includes("auth/email-already-in-use")) {
      return "This email is already registered. Please sign in instead. / یہ ای میل پہلے سے موجود ہے";
    }
    if (msg.includes("auth/weak-password")) {
      return "Password is too weak. Please use at least 6 characters. / پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے";
    }
    if (msg.includes("auth/popup-closed-by-user")) {
      return "Google sign-in was closed before completing.";
    }
    return msg;
  }
}
