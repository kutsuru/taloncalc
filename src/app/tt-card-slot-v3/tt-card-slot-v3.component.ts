import { Component, computed, inject, input, model, Signal } from '@angular/core';
import { CardLocations, ItemSubType } from '../core/models.v3';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { MatDialog } from '@angular/material/dialog';
import { CardSelectV3Input, TtCardSelectV3Component } from './tt-card-select-v3.component';
import { MatTooltipModule } from '@angular/material/tooltip';

enum CARD_IMG {
  SET = '/assets/img/card_set.png',
  UNSET = '/assets/img/card_unset.png'
}

@Component({
  selector: 'tt-card-slot-v3',
  imports: [MatTooltipModule],
  templateUrl: './tt-card-slot-v3.component.html',
  styleUrl: './tt-card-slot-v3.component.scss',
})
export class TtCardSlotV3Component {
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);
  private readonly _session = inject(TTSessionInfoV3Service);
  private readonly _dialoag = inject(MatDialog);

  /* inputs */
  cardType = input.required<ItemSubType>();
  cardLocation = input.required<CardLocations>();
  cardSlot = input<number>(-1);

  /* varbs */
  cardId = computed(() => {
    const cards = this._session.cards();
    const slot = this.cardSlot();
    const loc = this.cardLocation();
    if (slot >= 0) {
      return cards[loc][slot];
    }
    else {
      return cards[loc];
    }
  });
  cardName: Signal<string>;
  cardImg = computed(() => {
    const cardId = this.cardId();
    if (cardId > 0) {
      return CARD_IMG.SET;
    }
    else {
      return CARD_IMG.UNSET;
    }
  });

  constructor() {
    this.cardName = computed(() => {
      this._core.$loaded();
      const card = this._core.itemDB.get(this.cardId());
      return card ? card.name : '';
    });
  }

  selectCard() {
    this._dialoag.open<TtCardSelectV3Component, CardSelectV3Input, number | undefined>(TtCardSelectV3Component, {
      data: {
        cardId: this.cardId(),
        type: this.cardType()
      }
    })
      .afterClosed().subscribe((newCardId) => {
        if (newCardId !== undefined) {
          this._session.updateCard(this.cardLocation(), newCardId, this.cardSlot());
        }
      });
  }
}