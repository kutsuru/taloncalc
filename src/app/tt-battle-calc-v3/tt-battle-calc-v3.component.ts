import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TtBattleCalcPvmV3Component } from '../tt-battle-calc-pvm-v3/tt-battle-calc-pvm-v3.component';

@Component({
  selector: 'tt-battle-calc-v3',
  imports: [TtBattleCalcPvmV3Component],
  templateUrl: './tt-battle-calc-v3.component.html',
  styleUrl: './tt-battle-calc-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtBattleCalcV3Component {
  /* injects */
  readonly session = inject(TTSessionInfoV3Service);
}
