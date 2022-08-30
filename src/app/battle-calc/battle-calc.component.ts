import { Component, OnDestroy, OnInit } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SelectBattleTargetComponent } from './select-battle-target/select-battle-target.component';
import { TTCoreService } from '../core/tt-core.service';
import { Subscription } from 'rxjs';

interface BattleCardInfo {
  id: number;
  target: string;
}

@Component({
  selector: 'battle-calc',
  templateUrl: './battle-calc.component.html',
  styleUrls: ['./battle-calc.component.scss'],
  animations: [
    trigger('insertCalcTrigger', [
      transition(':enter', [
        style({
          opacity: 0,
        }),
        animate(
          '250ms',
          style({
            opacity: 1,
          })
        ),
      ]),
      transition(':leave', [animate('100ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class BattleCalcComponent implements OnInit, OnDestroy {
  private _detailId: number = 1;
  protected battleCalcLst: BattleCardInfo[] = [];
  private coreTargetSub!: Subscription;

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private ttCore: TTCoreService
  ) {}
  ngOnDestroy(): void {
    this.coreTargetSub.unsubscribe();
  }

  ngOnInit(): void {
    /* subscripe for battle calc target of the core serivce, to always re-init the battle cards if new target got loaded (e.g. by selection a saved build) */
    this.coreTargetSub = this.ttCore.battleCalcTargets.subscribe(
      (newTargets) => {
        console.log(newTargets);
        this.battleCalcLst = newTargets.map((target) => {
          return {
            id: this.createDetailId(),
            target: target,
          };
        });
      }
    );
  }

  private createDetailId(): number {
    return this._detailId++;
  }
  createBattleDetail() {
    console.log('createBattleDetail');
    const diaRef = this.dialog.open(SelectBattleTargetComponent);
    diaRef.afterClosed().subscribe((selectedTarget) => {
      if (selectedTarget) {
        this.battleCalcLst.push({
          id: this.createDetailId(),
          target: selectedTarget,
        });
      }
    });
  }
  closeBattleDetail(id?: number) {
    if (id) {
      let idx = this.battleCalcLst.findIndex((val, idx) => val.id == id);
      if (idx >= 0) {
        this.battleCalcLst.splice(idx, 1);
      }
    } else {
      this.battleCalcLst.pop();
    }
  }
}
