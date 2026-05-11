import { Injectable, ApplicationRef, createComponent, EnvironmentInjector, inject } from '@angular/core';
import { TTSnackbarContainerComponent } from './tt-snackbar-container.component';
import { TTSnackbarMessage, TTSnackbarSeverity } from './tt-snackbar.model';

@Injectable({ providedIn: 'root' })
export class TTSnackbarService {
    /* injects */
    #appRef = inject(ApplicationRef);
    #injector = inject(EnvironmentInjector);

    /* varbs */
    private container: TTSnackbarContainerComponent | null = null;

    /* private functions */
    #ensureContainer(): TTSnackbarContainerComponent {
        if (this.container) return this.container;

        const ref = createComponent(TTSnackbarContainerComponent, {
            environmentInjector: this.#injector,
        });
        this.#appRef.attachView(ref.hostView);
        document.body.appendChild(ref.location.nativeElement);
        this.container = ref.instance;
        return this.container;
    }

    /* public functions */
    show(
        message: string,
        severity: TTSnackbarSeverity = 'default',
        options: Partial<Pick<TTSnackbarMessage, 'duration' | 'action'>> = {}
    ): string {
        const id = crypto.randomUUID();
        this.#ensureContainer().add({ id, message, severity, ...options });
        return id;
    }

    dismiss(id: string): void {
        this.container?.remove(id);
    }
}