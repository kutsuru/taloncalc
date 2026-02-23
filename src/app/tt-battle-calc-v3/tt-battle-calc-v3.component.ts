import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TtBattleCalcPvmV3Component } from '../tt-battle-calc-pvm-v3/tt-battle-calc-pvm-v3.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TtSelectMobDialogComponent } from '../tt-select-mob-dialog/tt-select-mob-dialog.component';

@Component({
  selector: 'tt-battle-calc-v3',
  imports: [TtBattleCalcPvmV3Component, MatButtonModule, MatIconModule],
  templateUrl: './tt-battle-calc-v3.component.html',
  styleUrl: './tt-battle-calc-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtBattleCalcV3Component {
  /* injects */
  readonly session = inject(TTSessionInfoV3Service);
  private readonly _dialog = inject(MatDialog);

  /* public functions */
  addNewPVM() {
    this._dialog.open<TtSelectMobDialogComponent, any, number | undefined>(TtSelectMobDialogComponent)
      .afterClosed().subscribe((newMobId) => {
        if (newMobId !== undefined) {
          this.session.addBattleCalcPVM(newMobId);
        }
      });
  }
}
