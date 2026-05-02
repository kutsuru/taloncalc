import { computed, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

// FIXME: allow system? window.matchMedia('(prefers-color-scheme: dark)').matches);
export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class TtThemerV3Service {
  /* injects */
  readonly #document = inject(DOCUMENT);

  /* varbs */
  readonly #STORAGE_KEY = 'tt-app-theme';

  /* signals */
  #themeMode = signal<ThemeMode>(this.#loadStoredTheme());
  themeMode = this.#themeMode.asReadonly();
  isDarkMode = computed(() => this.#themeMode() === 'dark');

  constructor() {
    /* apply theme if changed */
    effect(() => {
      this.#applyTheme(this.#themeMode());
    });
  }

  /* private functions */
  #loadStoredTheme(): ThemeMode {
    const stored = localStorage.getItem(this.#STORAGE_KEY) as ThemeMode | null;
    return stored ?? 'light';
  }

  #applyTheme(theme: ThemeMode) {
    const html = this.#document.documentElement;
    const isDark = theme === 'dark';

    html.style.colorScheme = isDark ? 'dark' : 'light';

    // html.classList.toggle('dark', isDark); // backwards compatible
  }
  #setTheme(theme: ThemeMode) {
    this.#themeMode.set(theme);
    localStorage.setItem(this.#STORAGE_KEY, theme);
  }

  /* public functions */
  toggleTheme() {
    const newMode = this.#themeMode() === 'light' ? 'dark' : 'light';
    this.#setTheme(newMode);
  }
}
