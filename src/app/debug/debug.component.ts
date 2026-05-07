import { JsonPipe } from '@angular/common';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { TTBonusEngineService } from '../core/item-script/tt-bonus-engine.service';
import { createEmptySessionBonus, defaultEquipState } from '../core/session-info-default';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { BaseStatsAs, DBItem, SessionBonus } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { BuildData } from '../core/tt-body-builder.service';
import { TtSliderComponent } from "../tt-slider/tt-slider.component";

@Component({
  selector: 'app-debug',
  imports: [JsonPipe, TtSliderComponent],
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss',
})
export class DebugComponent {
  /* injects */
  readonly se = inject(TTSessionInfoV3Service);
  readonly core = inject(TTCoreServiceV3);
  readonly be = inject(TTBonusEngineService);

  /* hard coded builds - FIXME define a proper backend test/debug suite */
  readonly BUILD_1: BuildData = {
    jobClassName: 'Lord Knight',
    level: { base: 99, job: 70 },
    baseStats: { agi: 10, dex: 20, int: 30, luk: 40, str: 50, vit: 60 },
    equip: {
      rightHand: {
        item: 1430,
        cards: [4142, 4305, 4305],
        enchants: [],
        refine: 7
      }
    },
    pet: 9203,
    speedPotion: 657
  }

  readonly BUILD_2: BuildData = {
    jobClassName: 'High Wizard',
    level: { base: 99, job: 70 },
    baseStats: { agi: 15, dex: 90, int: 99, luk: 1, str: 1, vit: 40 },
    equip: {
      rightHand: {
        item: 1650,
        cards: [4142],
        enchants: [],
        refine: 7
      },
      leftHand: {
        item: 2161,
        cards: [],
        enchants: [4710, 4720],
        refine: 7,
      },
      upperHg: {
        item: 5013,
        cards: [],
        enchants: [],
        refine: 7,
      },
      middleHg: {
        item: 8348,
        cards: [],
        enchants: [4710],
        refine: 0,
      },
      lowerHg: {
        item: 5463,
        cards: [],
        enchants: [],
        refine: 0,
      },
      armor: {
        item: 2374,
        cards: [4451],
        enchants: [4712],
        refine: 7,
      },
      garment: {
        item: 2592,
        cards: [4520],
        enchants: [],
        refine: 0,
      },
      shoes: {
        item: 8049,
        cards: [],
        enchants: [],
        refine: 0,
      },
      lhAccessory: {
        item: 2630,
        cards: [4226],
        enchants: [],
        refine: 0,
      },
      rhAccessory: {
        item: 2630,
        cards: [4226],
        enchants: [],
        refine: 0,
      }
    },
    speedPotion: 657
  }
  readonly BUILD_HW_ENDGAME: BuildData = {
    jobClassName: 'High Wizard',
    level: { base: 99, job: 70 },
    baseStats: { agi: 15, dex: 90, int: 99, luk: 1, str: 1, vit: 40 },
    equip: {
      rightHand: {
        item: 1650,
        cards: [4142, 27384, 4526],
        enchants: [],
        refine: 7
      },
      leftHand: {
        item: 2161,
        cards: [4592],
        enchants: [4710, 4720],
        refine: 7,
      },
      upperHg: {
        item: 5013,
        cards: [],
        enchants: [],
        refine: 7,
      },
      middleHg: {
        item: 8348,
        cards: [4374],
        enchants: [4710],
        refine: 0,
      },
      lowerHg: {
        item: 5463,
        cards: [],
        enchants: [],
        refine: 0,
      },
      armor: {
        item: 2374,
        cards: [4451],
        enchants: [4712],
        refine: 7,
      },
      garment: {
        item: 2592,
        cards: [4520],
        enchants: [],
        refine: 0,
      },
      shoes: {
        item: 8049,
        cards: [4376],
        enchants: [],
        refine: 0,
      },
      lhAccessory: {
        item: 2630,
        cards: [4226],
        enchants: [],
        refine: 0,
      },
      rhAccessory: {
        item: 2630,
        cards: [4226],
        enchants: [],
        refine: 0,
      }
    },
    speedPotion: 657
  }

  statusItems: WritableSignal<string> = signal('');
  unknownScriptElements: WritableSignal<string[]> = signal([]);
  debugBonus: WritableSignal<SessionBonus> = signal(createEmptySessionBonus());

  sliderVal = signal(4);

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

  loadBuild(build : BuildData) {
    this.se.applyBuild(build);
  }

  dispRefine(val: number){
    return `+ ${val}`;
  }
}
