import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnDestroy, Signal, signal } from '@angular/core';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { TtValueComponent } from '../tt-value/tt-value.component';
import { SelectMobDialogData, TtSelectMobDialogComponent } from '../tt-select-mob-dialog/tt-select-mob-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { TTBattleSessionV3 } from '../core/tt-battle-session.v3';
import { DBSkill } from '../core/models.v3';

@Component({
  selector: 'tt-battle-calc-pvm-v3',
  imports: [
    MatCardModule,
    MatSlideToggleModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DecimalPipe,
    TtValueComponent,
    TitleCasePipe,
    MatDividerModule
  ],
  templateUrl: './tt-battle-calc-pvm-v3.component.html',
  styleUrl: './tt-battle-calc-pvm-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TTBattleSessionV3]
})
export class TtBattleCalcPvmV3Component implements OnDestroy {
  ngOnDestroy(): void {
    console.log('Im dead');
  }
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);
  private readonly _session = inject(TTSessionInfoV3Service);
  private readonly _dialog = inject(MatDialog);
  readonly battleSession = inject(TTBattleSessionV3);

  /* inputs */
  calcID = input.required<number>();
  calcTarget = input.required<number>();

  /* skill */
  // TODO: move to session info for better performance?
  // TODO: do we need avoid recalc when job changes?
  skillList: Signal<DBSkill[]> = computed(() => { 
    /* trigger */
    const job = this._session.jobClass();

    if (!job) return [];

    const jobMask = Number(job.mask);
    const skillList: DBSkill[] = [];
    for (const [skillId, skill] of this._core.skillDB) {
      if (
        skill.isActive &&
        (Number(skill.job) & jobMask) == jobMask
      ) {
        skillList.push(skill);
      }
    }

    return skillList;
  });

  /* varbs */
  target = computed(() => {
    this._core.$loaded();
    return this._core.mobDB.get(this.calcTarget()); // TODO: Default mob??
  });
  targetUrl = computed(() => {
    const mobID = this.calcTarget();
    return `https://talontales.com/panel/data/monsters/${mobID}.gif`;
  });
  autoRefresh = signal(false);
  refreshTrigger = signal(0);

  constructor() {
    /* effect for retrigger battle calc */
    effect(() => {
      /* component trigger */
      // TODO: session changes??
      const manRefresh = this.refreshTrigger();
      const autoRefresh = this.autoRefresh();
      this.target();
      /* session trigger */
      this._session.totalStats();

      if (autoRefresh || manRefresh > 0) {
        /* recalc the data */
        this.battleSession.simulate()
      }
    });
  }

  /*** public functions ***/
  changeTarget() {
    this._dialog.open<TtSelectMobDialogComponent, SelectMobDialogData, number | undefined>(TtSelectMobDialogComponent, {
      data: {
        target: this.calcTarget()
      }
    })
      .afterClosed().subscribe((newMobId) => {
        if (newMobId !== undefined) {
          this._session.updateBattleCalcPVM(this.calcID(), newMobId);
        }
      })
  }
  close() {
    this._session.removeBattleCalcPVM(this.calcID());
  }
  refresh() {
    this.refreshTrigger.update(x => x + 1);
  }
}
