import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { SQI_BONUS_CNT_MAX, TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { DBSQIBonus } from '../core/tt-models.v3';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type SQIBonusView = DBSQIBonus & {
  ID: string;
  checked: boolean;
};

@Component({
  selector: 'tt-sqi-bonus',
  imports: [MatSlideToggleModule],
  templateUrl: './tt-sqi-bonus.component.html',
  styleUrl: './tt-sqi-bonus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtSqiBonusComponent {
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);
  protected readonly session = inject(TTSessionInfoV3Service);

  /* signals*/
  bonusList = computed(() => {
    const sqiId = this.session.sqiEquipped();
    const bonis = this.session.sqiBonus();

    if (sqiId > 0) {
      /* get SQI item */
      const sqi = this._core.itemDB.get(sqiId);
      if (!sqi || !sqi.sqiBonus) return [];

      const res: SQIBonusView[] = [];
      for (const bonusId in sqi.sqiBonus) {
        const bonus: SQIBonusView = {
          ...sqi.sqiBonus[bonusId],
          ID: bonusId,
          checked: bonis.includes(bonusId)
        };
        res.push(bonus);
      }

      return res;
    }
    else {
      return [];
    }
  });

  /*** public functions ***/
  public isDisabled(bonus: SQIBonusView) {
    if (!bonus.checked && (this.session.sqiBonus().length >= SQI_BONUS_CNT_MAX)) return true;
    return false;
  }
}
