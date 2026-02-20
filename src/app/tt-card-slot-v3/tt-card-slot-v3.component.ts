import { Component, computed, inject, input, model, Signal } from '@angular/core';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';

@Component({
  selector: 'tt-card-slot-v3',
  imports: [],
  templateUrl: './tt-card-slot-v3.component.html',
  styleUrl: './tt-card-slot-v3.component.scss',
})
export class TtCardSlotV3Component {
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);

  /* inputs */
  cardId = model.required<number>();

  /* varbs */
  cardName: Signal<string>;

  constructor() {
    this.cardName = computed(() => {
      this._core.$loaded();
      const card = this._core.itemDB.get(this.cardId());
      return card ? card.name : '';
    });
  }

  debug() {
    this.cardId.set(4305);
  }
}