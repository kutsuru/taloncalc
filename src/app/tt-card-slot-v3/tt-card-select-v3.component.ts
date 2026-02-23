import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { DBItem, ItemSubType } from "../core/models.v3";
import { TTCoreServiceV3 } from "../core/tt-core.v3.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";

export type CardSelectV3Input = {
    cardId: number;
    type: ItemSubType
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
        for (const [id, item] of this._core.cardDB) {
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