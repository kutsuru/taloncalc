import { Component, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TTCoreService } from '../core/tt-core.service';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { BaseStatsAs, BaseStatsNames } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TtValueComponent } from "../tt-value/tt-value.component";

@Component({
  selector: 'tt-stats-v3',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    TtValueComponent
  ],
  templateUrl: './tt-stats-v3.component.html',
  styleUrl: './tt-stats-v3.component.scss',
})
export class TtStatsV3Component {
  /* injects */
  readonly session = inject(TTSessionInfoV3Service);
  private readonly _core = inject(TTCoreServiceV3);

  /* job */
  private _allJobs: string[] = [];
  jobClasses: string[] = [];
  selectedJob = new FormControl('', { nonNullable: true });

  /* levels */
  readonly maxStats: number[] = Array.from({ length: TTCoreService.MAX_LVL }, (_, i) => i + 1); // FIXME: Max level from diffrent place
  levels = new FormGroup({
    base: new FormControl(0, { nonNullable: true }),
    job: new FormControl(0, { nonNullable: true })
  });

  /* stats */
  baseStats: FormGroup<BaseStatsAs<FormControl<number>>> = new FormGroup({
    agi: new FormControl(0, { nonNullable: true }),
    str: new FormControl(0, { nonNullable: true }),
    vit: new FormControl(0, { nonNullable: true }),
    int: new FormControl(0, { nonNullable: true }),
    dex: new FormControl(0, { nonNullable: true }),
    luk: new FormControl(0, { nonNullable: true })
  });
  strBonus = computed(() => this.#computeBonusStat('str'));
  agiBonus = computed(() => this.#computeBonusStat('agi'));
  vitBonus = computed(() => this.#computeBonusStat('vit'));
  intBonus = computed(() => this.#computeBonusStat('int'));
  dexBonus = computed(() => this.#computeBonusStat('dex'));
  lukBonus = computed(() => this.#computeBonusStat('luk'));

  constructor() {
    /* core service */
    effect(() => {
      if (this._core.$loaded()) {
        this._allJobs = this._core.allJobNames;
        this.jobClasses = this._allJobs;
      }
    });
    /* effects */
    effect(() => {
      this.selectedJob.setValue(this.session.jobClassName(), { emitEvent: false });
    });
    effect(() => {
      const levels = this.session.level();
      this.levels.setValue({
        base: levels.base,
        job: levels.job
      }, { emitEvent: false });
    });
    effect(() => {
      const baseStats = this.session.baseStatsPure();
      this.baseStats.setValue({ ...baseStats }, { emitEvent: false });
    });

    /* form events */
    this.selectedJob.valueChanges.pipe(takeUntilDestroyed()).subscribe((val) => {
      if (val.length > 0) this.session.jobClassName.set(val);
    });
    this.levels.valueChanges.pipe(takeUntilDestroyed()).subscribe((val) => {
      this.session.level.set({
        base: val.base!,
        job: val.job!
      });
    });
    this.baseStats.valueChanges.pipe(takeUntilDestroyed()).subscribe((val) => {
      this.session.baseStatsPure.update((cur) => {
        return { ...cur, ...val };
      });
    });
  }

  #computeBonusStat(stat: BaseStatsNames): number {
    const bonus = this.session.bonus();
    const base = this.session.baseStats();
    const basePure = this.session.baseStatsPure();

    return bonus.stats[stat] + (base[stat] - basePure[stat]);
  }
}
