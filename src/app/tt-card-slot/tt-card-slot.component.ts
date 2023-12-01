import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CardLocations } from '../core/models';
import { MatDialog } from '@angular/material/dialog';
import { CARD_SELECT_INPUT, TtCardSelectComponent } from './tt-card-select.component';

enum CARD_IMG {
  SET = '/assets/img/card_set.png/',
  UNSET = '/assets/img/card_unset.png'
}

@Component({
  selector: 'tt-card-slot',
  templateUrl: './tt-card-slot.component.html',
  styleUrl: './tt-card-slot.component.scss'
})
export class TtCardSlotComponent implements OnInit, OnChanges {
  @Input() card: string = '';
  @Output() cardChange = new EventEmitter<string>();
  @Input() location: CardLocations = 'armor';

  imgPath: CARD_IMG = CARD_IMG.UNSET;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.setUnset(this.card);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['card']) {
      this.setUnset(changes['card'].currentValue);
    }
  }

  selectCard() {
    const diaRef = this.dialog.open<TtCardSelectComponent, CARD_SELECT_INPUT, string>(TtCardSelectComponent, {
      data: {
        location: this.location,
        card: this.card
      }
    });
    diaRef.afterClosed().subscribe((newCard) => {
      if (typeof newCard === 'undefined') {
        /* ignore */
      }
      else {
        /* its a string; either a new card, or empty string -> unset */
        this.setUnset(newCard);
      }
    })
  }

  private setUnset(card?: string) {
    if (card) {
      this.card = card;
      this.imgPath = CARD_IMG.SET;
    }
    else {
      this.card = '';
      this.imgPath = CARD_IMG.UNSET;
    }
    this.cardChange.emit(card);
  }
}
