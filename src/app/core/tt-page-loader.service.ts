import { computed, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type LoaderState = {
  total: number;
  completed: number;
  labels: string[]
}
type DoneFn = () => void;

@Injectable({ providedIn: 'root' })
export class TtPageLoaderService {
  /* signals */
  #state = signal<LoaderState>({
    total: 0,
    completed: 0,
    labels: []
  });
  isLoading = computed(() => {
    const s = this.#state();
    return s.total > 0 && s.completed < s.total;
  });
  currentLabel = computed(() => {
    return this.#state().labels.at(-1) ?? null;
  })
  progress = computed(() => {
    const { total, completed } = this.#state();
    return total === 0 ? null : { total, completed };
  });

  /* public functions */
  start(label: string): DoneFn {
    /* update state */
    this.#state.update(s => ({
      ...s,
      total: s.total + 1,
      labels: [...s.labels, label]
    }));

    /* create done function */
    return () => {
      this.#state.update(s => {
        const completed = s.completed + 1;
        const labels = s.labels.filter(_ => _ !== label);
        if (completed === s.total) {
          // finished
          return { completed: 0, total: 0, labels: [] };
        }
        return { ...s, completed, labels };
      });
    }
  }

  async loadUntil<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const doneFn = this.start(label);
    try {
      return await fn();
    }
    finally {
      doneFn();
    }
  }
}
