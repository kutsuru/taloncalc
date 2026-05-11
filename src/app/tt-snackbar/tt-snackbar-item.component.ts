import { ChangeDetectionStrategy, Component, computed, input, OnDestroy, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TTSnackbarMessage, TTSnackbarSeverity } from './tt-snackbar.model';
import { PartialRecord } from '../core/tt-models.v3';

const SEVERITY_ICON: PartialRecord<TTSnackbarSeverity, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
  debug: 'bug_report'
} as const;

@Component({
  selector: 'tt-snackbar-item',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tt-snackbar-item.component.scss',
  templateUrl: './tt-snackbar-item.component.html'
})
export class TTSnackbarItemComponent implements OnInit, OnDestroy {
  /* in- & outputs */
  snack = input.required<TTSnackbarMessage>();
  closed = output<string>();

  /* signals */
  icon = computed(() => {
    const snack = this.snack();
    if (snack.severity) return SEVERITY_ICON[snack.severity];

    return undefined;
  })

  /* varbs */
  #timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (this.snack().duration) {
      this.#timer = setTimeout(() => this.close(), this.snack().duration ?? 4000);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.#timer);
  }

  close(): void {
    clearTimeout(this.#timer);
    this.closed.emit(this.snack().id);
  }

  onAction(): void {
    this.snack().action?.onClick?.();
    this.close();
  }
}