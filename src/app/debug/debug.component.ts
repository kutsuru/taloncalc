import { JsonPipe } from '@angular/common';
import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { SESSION_EQUIP_DEFAULT, TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTBonusEngineService } from '../core/tt-bonus-engine.service';
import { createEmptySessionBonus } from '../core/session-info-default';
import { BaseStatsAs, DBItem, SessionBonus } from '../core/models.v3';

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
    const equip = { ...SESSION_EQUIP_DEFAULT };
    const stats: BaseStatsAs<number> = { agi: 0, dex: 0, int: 0, luk: 0, str: 0, vit: 0 };
    this.be.resetBonus(session, equip, stats, []);

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
