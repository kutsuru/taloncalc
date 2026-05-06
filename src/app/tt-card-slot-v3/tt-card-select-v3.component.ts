import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { TTCoreServiceV3 } from "../core/tt-core.v3.service";
import { CardTypes, DBItem } from "../core/tt-models.v3";

export type CardSelectV3Input = {
    cardId: number;
    type: CardTypes
}

@Component({
    selector: 'tt-card-select-v3',
    templateUrl: './tt-card-select-v3.component.html',
    styleUrl: './tt-card-select-v3.component.scss',
    imports: [MatDialogModule, MatFormFieldModule, ReactiveFormsModule, MatSelectModule, MatButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtCardSelectV3Component {
    /* injects */
    readonly #core = inject(TTCoreServiceV3);
    readonly data = inject<CardSelectV3Input>(MAT_DIALOG_DATA);
    readonly #diaRef = inject(MatDialogRef<TtCardSelectV3Component>);

    /* card list */
    cardList = computed(() => {
        return this.#core.cardDB[this.data.type].valuesSorted();
    });

    /* form control */
    cardForm = new FormControl<number>(this.data.cardId, { nonNullable: true });

    /* public functions */
    selectCard() {
        this.#diaRef.close(this.cardForm.value);
    }
    unselectCard() {
        this.#diaRef.close(0);
    }
}