import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TTSnackbarMessage } from './tt-snackbar.model';

const SEVERITY_CONFIG = {
    default: { icon: null, bg: 'var(--mat-sys-inverse-surface)', fg: 'var(--mat-sys-inverse-on-surface)' },
    debug: { icon: null, bg: 'var(--mat-sys-inverse-surface)', fg: 'var(--mat-sys-inverse-on-surface)' },
    success: { icon: 'check_circle', bg: 'var(--mat-sys-secondary-container)', fg: 'var(--mat-sys-on-secondary-container)' },
    error: { icon: 'error', bg: 'var(--mat-sys-error-container)', fg: 'var(--mat-sys-on-error-container)' },
    warning: { icon: 'warning', bg: 'var(--mat-sys-tertiary-container)', fg: 'var(--mat-sys-on-tertiary-container)' },
    info: { icon: 'info', bg: 'var(--mat-sys-primary-container)', fg: 'var(--mat-sys-on-primary-container)' },
} as const;


// FIXME: animations not working so far; some kind of known bug for dynamic elements and animat.enter
@Component({
    selector: 'tt-snackbar-item',
    standalone: true,
    imports: [MatButtonModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { 
        'animate.enter': 'snack-enter',
        'animate.leave': 'snack-leave',
    },
    template: `
    <div class="snack" [style.background]="cfg.bg" [style.color]="cfg.fg">

      @if (cfg.icon) {
        <mat-icon class="snack-icon">{{ cfg.icon }}</mat-icon>
      }

      <span class="snack-message mat-body-medium">{{ snack.message }}</span>

      @if (snack.action) {
        <button mat-button class="snack-action" (click)="onAction()">
          {{ snack.action.label }}
        </button>
      }

      <button mat-icon-button class="snack-close" (click)="close()" aria-label="Schließen">
        <mat-icon>close</mat-icon>
      </button>

      <div class="snack-progress"
           [style.animation-duration]="(snack.duration ?? 4000) + 'ms'">
      </div>

    </div>
  `,
    styles: [`
    /* ── Host ── */
    :host {
      display: block;
      pointer-events: all;
      width: 100%;
      min-width: 288px;
      max-width: 560px;
    }

    :host.snack-enter {
      animation: snack-in 2500ms var(--mat-sys-motion-emphasized-decelerate) forwards;
    }

    :host.snack-leave {
      animation: snack-out 2000ms var(--mat-sys-motion-emphasized-accelerate) forwards;
    }

    @keyframes snack-in {
      from { opacity: 0; transform: translateY(12px) scale(.97); }
      to   { opacity: 1; transform: none; }
    }

    @keyframes snack-out {
      from { opacity: 1; transform: none; }
      to   { opacity: 0; transform: translateY(8px) scale(.97); }
    }

    /* ── Layout ── */
    .snack {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 4px 16px;
      border-radius: var(--mat-sys-corner-extra-small);
      box-shadow: var(--mat-sys-level3);
      position: relative;
      overflow: hidden;
    }

    .snack-icon {
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .snack-message {
      flex: 1;
      padding: 10px 0;
    }

    .snack-action {
      flex-shrink: 0;
    }

    .snack-close {
      flex-shrink: 0;
      opacity: .7;
    }

    /* ── Progress bar ── */
    .snack-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      width: 100%;
      background: currentColor;
      opacity: .3;
      transform-origin: left;
      animation: snack-progress linear forwards;
    }

    @keyframes snack-progress {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    /* ── Mobile ── */
    @media (max-width: 599px) {
      :host { max-width: 100%; min-width: 0; }
      .snack { border-radius: 0; }
    }
  `],
})
export class TTSnackbarItemComponent implements OnInit, OnDestroy {
    @Input({ required: true }) snack!: TTSnackbarMessage;
    @Output() closed = new EventEmitter<string>();

    get cfg() {
        return SEVERITY_CONFIG[this.snack.severity ?? 'default'];
    }

    private timer?: ReturnType<typeof setTimeout>;

    ngOnInit(): void {
        this.timer = setTimeout(() => this.close(), this.snack.duration ?? 4000);
    }

    ngOnDestroy(): void {
        clearTimeout(this.timer);
    }

    close(): void {
        clearTimeout(this.timer);
        this.closed.emit(this.snack.id);
    }

    onAction(): void {
        this.snack.action?.onClick?.();
        this.close();
    }
}