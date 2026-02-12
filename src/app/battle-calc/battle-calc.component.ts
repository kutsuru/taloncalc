import { Component } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { SelectBattleTargetComponent } from './select-battle-target/select-battle-target.component';
import { Observable } from 'rxjs';
import { BattleCalcInfo } from '../core/models';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NgFor, AsyncPipe } from '@angular/common';
import { BattleCalcPvmComponent } from '../battle-calc-pvm/battle-calc-pvm.component';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tt-battle-calc',
    templateUrl: './battle-calc.component.html',
    styleUrls: ['./battle-calc.component.scss'],
    animations: [
        trigger('insertCalcTrigger', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('250ms', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('100ms', style({ opacity: 0 }))
            ]),
        ]),
    ],
    imports: [
        MatTabGroup,
        MatTab,
        NgFor,
        BattleCalcPvmComponent,
        MatFabButton,
        MatIcon,
        AsyncPipe,
    ]
})
export class BattleCalcComponent {
  public battleCalcPVM$: Observable<BattleCalcInfo[]>;

  constructor(private dialog: MatDialog, private sessionInfo: TTSessionInfoV2Service) {
    this.battleCalcPVM$ = this.sessionInfo.battleCalcPVM$;
  }
  createBattleDetailPVM() {
    const diaRef = this.dialog.open(SelectBattleTargetComponent);
    diaRef.afterClosed().subscribe((selectedTarget) => {
      if (selectedTarget) {
        this.sessionInfo.addBattleCalcPVM(selectedTarget);
      }
    });
  }
  closeBattleDetailPVM(id: number) {
    this.sessionInfo.removeBattleCalcPVM(id);
  }
  updateBattleDetailPVMTarget(id: number, target: string) {
    this.sessionInfo.updateBattleCalcPVM(id, target);
  }
}
