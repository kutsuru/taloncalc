import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DBMob } from '../core/models.v3';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';

export type SelectMobDialogData = {
  target?: number;
}

@Component({
  selector: 'tt-select-mob-dialog',
  imports: [MatDialogModule, MatFormFieldModule, ReactiveFormsModule, MatSelectModule, MatButtonModule],
  templateUrl: './tt-select-mob-dialog.component.html',
  styleUrl: './tt-select-mob-dialog.component.scss',
})
export class TtSelectMobDialogComponent {
  /* injects */
  private readonly _data = inject<SelectMobDialogData>(MAT_DIALOG_DATA);
  private readonly _core = inject(TTCoreServiceV3);

  /* form for selection */
  selectedMob = new FormControl<number>(this._data?.target ?? -1, { nonNullable: true });

  /* list of all mobs */
  mobsAll = computed(() => {
    this._core.$loaded();
    let res: DBMob[] = [];
    for (const [mobId, mob] of this._core.mobDB) {
      res.push(mob);
    }
    return res;
  });
}