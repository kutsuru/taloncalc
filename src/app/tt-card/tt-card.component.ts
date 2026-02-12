import { Component, input } from '@angular/core';

import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    selector: 'tt-card',
    imports: [
    MatExpansionModule
],
    templateUrl: './tt-card.component.html',
    styleUrl: './tt-card.component.scss'
})
export class TtCardComponent {
  expanded = input<boolean>(true);
}
