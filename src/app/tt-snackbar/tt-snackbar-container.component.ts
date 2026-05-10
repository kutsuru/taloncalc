import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TTSnackbarItemComponent } from './tt-snackbar-item.component';
import { TTSnackbarMessage } from './tt-snackbar.model';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'tt-snackbar-container',
    standalone: true,
    imports: [TTSnackbarItemComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="snackbar-stack" aria-live="polite" aria-atomic="false">
      @for (msg of messages(); track msg.id) {
        <tt-snackbar-item
          [snack]="msg"
          (closed)="remove($event)"
        />
      }
    </div>
  `,
    styles: [`
    .snackbar-stack {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      z-index: 9999;
      pointer-events: none;
      align-items: center;
    }

    @media (max-width: 599px) {
      .snackbar-stack {
        bottom: 0;
        left: 0;
        transform: none;
        width: 100%;
        padding: 0;
      }
    }
  `],
})
export class TTSnackbarContainerComponent {
    messages = signal<TTSnackbarMessage[]>([]);

    add(msg: TTSnackbarMessage): void {
        if (msg.severity === 'debug' && environment.production) return;
        this.messages.update(m => [...m, msg]);
    }

    remove(id: string): void {
        this.messages.update(m => m.filter(x => x.id !== id));
    }
}