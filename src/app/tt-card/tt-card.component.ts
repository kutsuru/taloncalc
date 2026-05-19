import { ChangeDetectionStrategy, Component, input, linkedSignal, signal } from '@angular/core';

import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    selector: 'tt-card',
    imports: [
        MatExpansionModule
    ],
    templateUrl: './tt-card.component.html',
    styleUrl: './tt-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtCardComponent {
    expanded = input<boolean>(true);
    allowOverflow = linkedSignal(() => this.expanded());

    setOverflow(to: boolean) {
        this.allowOverflow.set(to);
    }
}
