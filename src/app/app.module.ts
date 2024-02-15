import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { TtCollapseModule } from './tt-collapse/tt-collapse.module';
import { ChangelogComponent } from './changelog/changelog.component';
import { PvmComponent } from './pvm/pvm.component';
import { DbRequestComponent } from './db-request/db-request.component';
import { HttpClientModule } from '@angular/common/http';
import { TtPageLoaderModule } from './tt-page-loader/tt-page-loader.module';
import { TtMapSelectorComponent } from './tt-components/tt-map-selector.component';
import { TtListSelectorComponent } from './tt-components/tt-list-selector.component';
import { FilteredKeyValuePipe } from './core/filtered-key-value.pipe';
import { TtKeySelectComponent } from './tt-components/tt-key-select/tt-key-select.component';
import { BattleCalcComponent } from './battle-calc/battle-calc.component';
import { SelectBattleTargetComponent } from './battle-calc/select-battle-target/select-battle-target.component';
import { TTPopupModule } from './tt-popup/tt-popup.module';
import { TtMaskGeneratorComponent } from './tt-mask-generator/tt-mask-generator.component';
import { TtFoodComponentOld } from './tt-food__old/tt-food.component';
import { TtValueInfo } from './tt-food__old/tt-value-info.pipe';
import { TtLvArrayPipe, TtRangePipe } from './core/tt-lv-array.pipe';
import { TtSettingsComponent } from './tt-settings/tt-settings.component';
import { TtStatsComponent } from './tt-stats/tt-stats.component';
import { TtStatsInfoComponent } from './tt-stats-info/tt-stats-info.component';
import { TtEquipComponent } from './tt-equip/tt-equip.component';
import { TtSimpleSelectComponent } from './tt-simple-select/tt-simple-select.component';
import { TtBuffComponent } from './tt-buff/tt-buff.component';
import { TtPassiveComponent } from './tt-passive/tt-passive.component';
import { TtCardSlotComponent } from './tt-card-slot/tt-card-slot.component';
import { TtCardSelectComponent } from './tt-card-slot/tt-card-select.component';
import { BattleCalcPvmComponent } from './battle-calc-pvm/battle-calc-pvm.component';
import { TtBuffComponentOld } from './tt-buff__old/tt-buff.component';
import { TtPassiveComponentOld } from './tt-passive__old/tt-passive.component';
import { TtFoodComponent } from './tt-food/tt-food.component';

@NgModule({
  declarations: [
    AppComponent,
    ChangelogComponent,
    PvmComponent,
    DbRequestComponent,
    TtMapSelectorComponent,
    TtListSelectorComponent,
    TtKeySelectComponent,
    FilteredKeyValuePipe,
    BattleCalcComponent,
    SelectBattleTargetComponent,
    TtMaskGeneratorComponent,
    TtValueInfo,
    TtLvArrayPipe,
    TtRangePipe,
    TtSettingsComponent,
    TtStatsComponent,
    TtStatsInfoComponent,
    TtEquipComponent,
    TtSimpleSelectComponent,
    TtBuffComponent,
    TtPassiveComponent,
    TtCardSlotComponent,
    TtCardSelectComponent,
    BattleCalcPvmComponent,
    TtFoodComponent,
    // OLD
    TtBuffComponentOld,
    TtPassiveComponentOld,
    TtFoodComponentOld,
  ],
  imports: [
    BrowserModule,
    // AppRoutingModule,  /* FIXME: will be needed for URL-parser */
    BrowserAnimationsModule,
    MaterialModule,
    TtCollapseModule,
    HttpClientModule,
    TtPageLoaderModule,
    FormsModule,
    ReactiveFormsModule,
    TTPopupModule
  ],
  providers: [FilteredKeyValuePipe, TtLvArrayPipe],
  bootstrap: [AppComponent],
})
export class AppModule { }
