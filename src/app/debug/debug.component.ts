import { JsonPipe } from '@angular/common';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { TTBonusEngineService } from '../core/item-script/tt-bonus-engine.service';
import { createEmptySessionBonus, defaultEquipState } from '../core/session-info-default';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { BaseStatsAs, DBItem, SessionBonus } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';

@Component({
  selector: 'app-debug',
  imports: [JsonPipe],
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss',
})
export class DebugComponent {
  /* injects */
  readonly se = inject(TTSessionInfoV3Service);
  readonly core = inject(TTCoreServiceV3);
  readonly be = inject(TTBonusEngineService);

  statusItems: WritableSignal<string> = signal('');
  unknownScriptElements: WritableSignal<string[]> = signal([]);
  debugBonus: WritableSignal<SessionBonus> = signal(createEmptySessionBonus());

  testItemScripts() {
    const session = createEmptySessionBonus();
    const equip = defaultEquipState();
    const stats: BaseStatsAs<number> = { agi: 0, dex: 0, int: 0, luk: 0, str: 0, vit: 0 };
    this.be.resetBonus(session, {
      level: { base: 0, job: 0 },
      baseStats: stats,
      equip: equip,
      lefhtHandtType: 'Unarmed',
      rightHandType: 'Unarmed',
      isPVP: false,
      skills: [],
    });

    /* items */
    let cnt = 1;
    const itemsWithScript: DBItem[] = [];
    this.core.itemDB.forEach((_) => {
      if (_.itemScript) itemsWithScript.push(_);
    });

    let good = 0;
    let bad = 0;
    for (const item of itemsWithScript) {
      try {
        this.be.applyBonus(item.itemScript);
        good++;
      }
      catch (e) {
        bad++;
        console.log(e);
        console.log(item.itemScript);
        break;
      }
      cnt++;
    }
    this.statusItems.set(`Total: ${itemsWithScript.length} Good: ${good} Failed: ${bad} Rate: ${((good / itemsWithScript.length) * 100).toFixed(2)} %`);
    /* item combos */

    /* skills?? */

    this.unknownScriptElements.set(this.be.getUnknownElements());
    this.debugBonus.set(session);
  }
}
