import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { BonusID } from '../core/item-script/tt-bonus-engine.service';
import { extractBonusID } from '../core/utils';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TTBonusTranslatorService } from '../core/item-script/tt-bonus-translator.service';

type AutoBonusUI = {
  id: BonusID,
  name: string,
  isActive: boolean,
  bonus: string,
}

@Component({
  selector: 'tt-extra-bonus',
  imports: [MatSlideToggleModule],
  templateUrl: './tt-extra-bonus.component.html',
  styleUrl: './tt-extra-bonus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtExtraBonusComponent {
  /* injects */
  readonly #core = inject(TTCoreServiceV3);
  readonly #translator = inject(TTBonusTranslatorService);
  readonly session = inject(TTSessionInfoV3Service);

  /* signals */
  autobonusList = computed(() => {
    const bonus = this.session.bonus();
    const autoBonusState = this.session.autoBonus();

    /**
     * merge the available autobonus scripts with the "selected onces"
     */
    let abMap: AutoBonusUI[] = [];
    for (const abID of bonus.autoBonus.keys()) {
      const curAB = extractBonusID(abID);

      // FIXME: provide some method for better description
      let name = '';
      let readableBonusStr = '';
      switch (curAB.source) {
        case 'item':
          // get item name
          let item = this.#core.itemDB.get(+curAB.id);
          if (item) {
            name = item.name;
            // get readable scipt
            // FIXME: over-sized; maybe just create a look-up for the 82 avaiable autobonus items instead of massive service?
            const scripts = bonus.autoBonus.get(abID);
            const scriptsComb = scripts?.join(';') ?? "";
            const readableBonus = this.#translator.toReadable(scriptsComb);
            readableBonusStr = readableBonus.join(' - ');
          }
          break;
      }
      if (name.length > 0) {
        abMap.push({
          id: abID,
          name: name,
          isActive: autoBonusState.includes(abID),
          bonus: readableBonusStr
        });
      }
    }
    return abMap;
  });
}
