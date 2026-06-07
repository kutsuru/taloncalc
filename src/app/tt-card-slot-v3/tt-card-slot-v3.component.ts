import { ChangeDetectionStrategy, Component, computed, inject, input, model, Signal } from '@angular/core';
import { CardLocations, CardTypes, ItemSubType } from '../core/tt-models.v3';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtCardSlotV3Component {
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);
  private readonly _session = inject(TTSessionInfoV3Service);
  private readonly _dialoag = inject(MatDialog);

  /* inputs */
  cardId = model.required<number>();
  cardType = input.required<CardTypes>();

  /* varbs */
  cardName = computed(() => {
    const card = this._core.itemDB.get(this.cardId());
    return card ? card.name : '';
  });
  cardImg = computed(() => {
    const cardId = this.cardId();
    if (cardId > 0) {
      return CARD_IMG.SET;
    }
    else {
      return CARD_IMG.UNSET;
    }
  });

  selectCard() {
    this._dialoag.open<TtCardSelectV3Component, CardSelectV3Input, number | undefined>(TtCardSelectV3Component, {
      data: {
        cardId: this.cardId(),
        type: this.cardType()
      }
    })
      .afterClosed().subscribe((newCardId) => {
        if (newCardId !== undefined) {
          this.cardId.set(newCardId);
        }
      });
  }
}