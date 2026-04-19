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
    private readonly _core = inject(TTCoreServiceV3);
    readonly data = inject<CardSelectV3Input>(MAT_DIALOG_DATA);
    private readonly _diaRef = inject(MatDialogRef<TtCardSelectV3Component>);

    /* card list */
    cardList = computed(() => {
        let res: DBItem[] = [];
        for (const item of this._core.cardDB.valuesSorted()) {
            if (item.subType === this.data.type) {
                res.push(item);
            }
        }
        return res;
    });

    /* form control */
    cardForm = new FormControl<number>(this.data.cardId, { nonNullable: true });

    /* public functions */
    selectCard() {
        this._diaRef.close(this.cardForm.value);
    }
    unselectCard() {
        this._diaRef.close(0);
    }
}