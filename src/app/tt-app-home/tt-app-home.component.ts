import { Component, inject, OnInit } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { TtCardComponent } from '../tt-card/tt-card.component';
import { TtStatsInfoComponent } from '../tt-stats-info/tt-stats-info.component';
import { TtBuffComponent } from '../tt-buff/tt-buff.component';
import { TtMaskGeneratorComponent } from '../tt-mask-generator/tt-mask-generator.component';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TTPopupButtonComponent } from '../tt-popup/tt-popup-button.component';
import { TtPopupGroupComponent } from '../tt-popup/tt-popup-group.component';
import { TtPopupComponent } from '../tt-popup/tt-popup.component';
import { TtSettingsComponent } from '../tt-settings/tt-settings.component';
import { TtStatsV3Component } from '../tt-stats-v3/tt-stats-v3.component';
import { TtStatsInfoV3Component } from '../tt-stats-info-v3/tt-stats-info-v3.component';
import { TtEquipV3Component } from '../tt-equip-v3/tt-equip-v3.component';
import { TtBattleCalcV3Component } from '../tt-battle-calc-v3/tt-battle-calc-v3.component';
import { TtBuffV3Component } from '../tt-buff-v3/tt-buff-v3.component';
import { TtPassiveV3Component } from '../tt-passive-v3/tt-passive-v3.component';
import { TtFoodV3Component } from '../tt-food-v3/tt-food-v3.component';
import { DebugComponent } from '../debug/debug.component';
import { TtSqiBonusComponent } from '../tt-sqi-bonus/tt-sqi-bonus.component';
import { TtThemerV3Component } from '../tt-themer/tt-themer-v3.component';
import { TtBattleTestRunnerComponent } from '../tt-battle-test-runner/tt-battle-test-runner.component';
import { TtExtraBonusComponent } from '../tt-extra-bonus/tt-extra-bonus.component';
import { TtSettingsService } from '../tt-settings/tt-settings.service';

@Component({
  selector: 'app-tt-app-home',
  imports: [
    MatToolbar,
    TtCardComponent,
    TtStatsInfoComponent,
    TtBuffComponent,
    TtMaskGeneratorComponent,
    MatMiniFabButton,
    MatIcon,
    TTPopupButtonComponent,
    TtPopupGroupComponent,
    TtPopupComponent,
    TtSettingsComponent,
    TtStatsV3Component,
    TtStatsInfoV3Component,
    TtEquipV3Component,
    TtBattleCalcV3Component,
    TtBuffV3Component,
    TtPassiveV3Component,
    TtFoodV3Component,
    DebugComponent,
    TtSqiBonusComponent,
    TtThemerV3Component,
    TtBattleTestRunnerComponent,
    TtExtraBonusComponent,
  ],
  templateUrl: './tt-app-home.component.html',
  styleUrl: './tt-app-home.component.scss',
})
export class TtAppHomeComponent implements OnInit {
  /* injects */
  readonly ttSettings = inject(TtSettingsService);

  ngOnInit(): void {
   
  }

}
