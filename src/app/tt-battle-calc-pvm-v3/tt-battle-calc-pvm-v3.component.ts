import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnDestroy, signal, untracked, WritableSignal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { SelectMobDialogData, TtSelectMobDialogComponent } from '../tt-select-mob-dialog/tt-select-mob-dialog.component';
import { TtValueComponent } from '../tt-value/tt-value.component';
import { TTBattleSessionServiceV3 } from '../core/tt-battle-session.v3.service';

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
    MatDividerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule
  ],
  templateUrl: './tt-battle-calc-pvm-v3.component.html',
  styleUrl: './tt-battle-calc-pvm-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TTBattleSessionServiceV3]
})
export class TtBattleCalcPvmV3Component implements OnDestroy {
  ngOnDestroy(): void {
    console.log('Im dead');
  }
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);
  readonly session = inject(TTSessionInfoV3Service);
  private readonly _dialog = inject(MatDialog);
  readonly battleSession = inject(TTBattleSessionServiceV3);

  /* inputs */
  calcID = input.required<number>();
  calcTarget = input.required<number>();

  /* target */
  target = computed(() => {
    this._core.$loaded();
    return this._core.mobDB.get(this.calcTarget()); // TODO: Default mob??
  });
  targetUrl = computed(() => {
    const mobID = this.calcTarget();
    return `https://talontales.com/panel/data/monsters/${mobID}.gif`;
  });

  /* skill */
  // TODO: fetch somehow from session?
  skillID = new FormControl<number>(0, { nonNullable: true });
  skillLvl = new FormControl<number>(0, { nonNullable: true });
  skillLvlList: WritableSignal<number[]> = signal([]);
  skillHasLvl: WritableSignal<boolean> = signal(false);

  /* refresh */
  autoRefresh = signal(false);
  refreshTrigger = signal(0);

  constructor() {
    /* effect for retrigger battle calc */
    effect(() => {
      /* component trigger */
      // TODO: session changes??
      const manRefresh = this.refreshTrigger();
      const autoRefresh = this.autoRefresh();
      const target = this.target();
      /* session trigger */
      this.session.totalStats();

      if (autoRefresh || manRefresh > 0) {
        /* recalc untracked to avoid the effect being triggered by new session data inside the calc*/
        this.battleSession.updateTarget(target);
        untracked(() => {
          this.battleSession.simulate();
        });
      }
    });

    /* update skill list & level based on selection */
    this.skillID.valueChanges.subscribe((newID) => {
      // update skill level list
      const skill = this._core.skillDB.get(newID);
      if (skill) {
        this.skillLvlList.set(Array.from({ length: skill.maxLevel }, (_, i) => i + 1));
        this.skillLvl.setValue(skill.maxLevel);
        this.skillHasLvl.set(skill.maxLevel > 1);
      }
      // update battle session
      this.battleSession.updateSkill(newID, skill?.maxLevel ?? 0);
      if (this.autoRefresh()) {
        this.refresh();
      }
    });

    /* update skill selection if job changes */
    effect(() => {
      this.session.jobClass();
      this.skillID.setValue(0);  //FIXME: only change if skill not longer present?
    });

    /* update skill level in battle session */
    this.skillLvl.valueChanges.subscribe((newLvl) => {
      this.battleSession.updateSkill(this.skillID.value, newLvl);
      if (this.autoRefresh()) {
        this.refresh();
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
          this.session.updateBattleCalcPVM(this.calcID(), newMobId);
        }
      })
  }
  close() {
    this.session.removeBattleCalcPVM(this.calcID());
  }
  refresh() {
    this.refreshTrigger.update(x => x + 1);
  }
}
