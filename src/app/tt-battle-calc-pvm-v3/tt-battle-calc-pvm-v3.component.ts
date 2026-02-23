import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'tt-battle-calc-pvm-v3',
  imports: [MatCardModule, MatSlideToggleModule],
  templateUrl: './tt-battle-calc-pvm-v3.component.html',
  styleUrl: './tt-battle-calc-pvm-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtBattleCalcPvmV3Component {
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);
  private readonly _session = inject(TTSessionInfoV3Service);

  /* inputs */
  calcID = input.required<number>();
  calcTarget = input.required<number>();

  /* varbs */
  target = computed(() => {
    this._core.$loaded();
    return this._core.mobDB.get(this.calcTarget()); // TODO: Default mob??
  });
  targetUrl = computed(() => {
    const mobID = this.calcTarget();
    return `https://talontales.com/panel/data/monsters/${mobID}.gif`;
  });

  changeTarget() {
    let newId = Math.floor(Math.random() * 1000) + 1000;
    this._session.updateBattleCalcPVM(this.calcID(), newId);
  }
  close() {
    this._session.removeBattleCalcPVM(this.calcID());
  }
}
