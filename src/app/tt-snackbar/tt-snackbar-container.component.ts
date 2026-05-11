import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { TTSnackbarItemComponent } from './tt-snackbar-item.component';
import { TTSnackbarMessage } from './tt-snackbar.model';
import { environment } from 'src/environments/environment';
import { TtSettingsService } from '../tt-settings/tt-settings.service';

@Component({
    selector: 'tt-snackbar-container',
    standalone: true,
    imports: [TTSnackbarItemComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './tt-snackbar-container.component.scss',
    templateUrl: './tt-snackbar-container.component.html',
})
export class TTSnackbarContainerComponent {
    readonly #ttSettings = inject(TtSettingsService);
    messages = signal<TTSnackbarMessage[]>([]);

    add(msg: TTSnackbarMessage): void {
        if (msg.severity === 'debug' && !this.#ttSettings.debug()) return;
        this.messages.update(m => [...m, msg]);
    }

    remove(id: string): void {
        this.messages.update(m => m.filter(x => x.id !== id));
    }
}