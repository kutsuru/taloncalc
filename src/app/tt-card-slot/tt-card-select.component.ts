import { Component, Inject, OnInit } from "@angular/core";
import { CardLocations } from "../core/models";
import { MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from "@angular/material/dialog";
import { TTCoreService } from "../core/tt-core.service";
import { TtSimpleSelectComponent } from "../tt-simple-select/tt-simple-select.component";
import { MatButton } from "@angular/material/button";

export type CARD_SELECT_INPUT = {
    location: CardLocations,
    card?: string
}

@Component({
    selector: 'tt-card-select',
    templateUrl: 'tt-card-select.component.html',
    imports: [MatDialogTitle, MatDialogContent, TtSimpleSelectComponent, MatDialogActions, MatButton, MatDialogClose]
})
export class TtCardSelectComponent implements OnInit {
    cards: string[] = [];
    selectedCard: string = '';

    constructor(@Inject(MAT_DIALOG_DATA) public data: CARD_SELECT_INPUT, private core: TTCoreService) { }

    ngOnInit(): void {
        /* filter card DB depending on location */
        let alLCards = this.core.cardDbV2;
        let res: string[] = [];
        for (let cardName in alLCards) {
            if (alLCards[cardName].location === this.data.location) {
                res.push(cardName);
            }
        }
        this.cards = res;
        this.selectedCard = this.data.card || '';
    }
}