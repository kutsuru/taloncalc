import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { Subscription } from 'rxjs';
import { TTSessionInfoV2Service } from './core/tt-session-info_v2.service';
import { TtBuffComponent } from './tt-buff/tt-buff.component';
import { TtCardComponent } from './tt-card/tt-card.component';
import { TtMaskGeneratorComponent } from './tt-mask-generator/tt-mask-generator.component';
import { TtPageLoaderService } from './tt-page-loader/tt-page-loader.service';
import { TtPopupGroupComponent } from './tt-popup/tt-popup-group.component';
import { TtSettingsService } from './tt-settings/tt-settings.service';
import { TtStatsInfoComponent } from './tt-stats-info/tt-stats-info.component';
import { TTCoreServiceV3 } from './core/tt-core.v3.service';
import { TTSessionInfoV3Service } from './core/tt-session-info.v3.service';
import { DebugComponent } from './debug/debug.component';
import { TtBattleCalcV3Component } from './tt-battle-calc-v3/tt-battle-calc-v3.component';
import { TtBuffV3Component } from "./tt-buff-v3/tt-buff-v3.component";
import { TtEquipV3Component } from "./tt-equip-v3/tt-equip-v3.component";
import { TtFoodV3Component } from './tt-food-v3/tt-food-v3.component';
import { TtPageLoaderComponent } from './tt-page-loader/tt-page-loader.component';
import { TtPassiveV3Component } from "./tt-passive-v3/tt-passive-v3.component";
import { TTPopupButtonComponent } from './tt-popup/tt-popup-button.component';
import { TtPopupComponent } from './tt-popup/tt-popup.component';
import { TtSettingsComponent } from './tt-settings/tt-settings.component';
import { TtStatsInfoV3Component } from './tt-stats-info-v3/tt-stats-info-v3.component';
import { TtStatsV3Component } from './tt-stats-v3/tt-stats-v3.component';
import { TtSqiBonusComponent } from "./tt-sqi-bonus/tt-sqi-bonus.component";
import { TtThemerV3Component } from './tt-themer/tt-themer-v3.component';
import { TtBattleTestRunnerComponent } from './tt-battle-test-runner/tt-battle-test-runner.component';
import { TtExtraBonusComponent } from './tt-extra-bonus/tt-extra-bonus.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    MatToolbar,
    TtCardComponent,
    TtStatsInfoComponent,
    TtBuffComponent,
    TtMaskGeneratorComponent,
    MatMiniFabButton,
    MatIcon,
    TTPopupButtonComponent,
    TtPageLoaderComponent,
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
    TtExtraBonusComponent
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  readonly se = inject(TTSessionInfoV3Service);
  readonly ttCoreV3 = inject(TTCoreServiceV3);


  private settingsPopupSub!: Subscription;
  @ViewChild(TtPopupGroupComponent) popupGroup!: TtPopupGroupComponent;
  constructor(
    private ttLoaderService: TtPageLoaderService,
    protected ttSettings: TtSettingsService,
    private session: TTSessionInfoV2Service
  ) {
  }

  ngOnDestroy(): void {
    this.settingsPopupSub.unsubscribe();
  }

  ngOnInit() {
    this.settingsPopupSub = this.ttSettings.popupChanged$.subscribe((val) => {
      console.log('close popups');
      /* close all popups */
      this.popupGroup.closeAll();
      console.log(this.popupGroup);
    });

    // FIXME: show loader
    this.ttCoreV3.initializeCore$().subscribe((_) => {
      // done
    });
  }

}