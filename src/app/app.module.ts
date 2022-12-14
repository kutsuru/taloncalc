import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { TtCollapseModule } from './tt-collapse/tt-collapse.module';
import { FlexLayoutModule } from '@angular/flex-layout';
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
import { BattleCalcPvmComponent } from './battle-calc/battle-calc-pvm/battle-calc-pvm.component';
import { SelectBattleTargetComponent } from './battle-calc/select-battle-target/select-battle-target.component';
import { TTPopupModule } from './tt-popup/tt-popup.module';
import { TtMaskGeneratorComponent } from './tt-mask-generator/tt-mask-generator.component';
import { TtFoodComponent } from './tt-food/tt-food.component';
import { TtValueInfo } from './tt-food/tt-value-info.pipe';
import { TtPassiveComponent } from './tt-passive/tt-passive.component';
import { TtBuffComponent } from './tt-buff/tt-buff.component';
import { TtLvArrayPipe, TtRangePipe } from './tt-buff/tt-lv-array.pipe';
import { TtSettingsComponent } from './tt-settings/tt-settings.component';

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
    BattleCalcPvmComponent,
    SelectBattleTargetComponent,
    TtMaskGeneratorComponent,
    TtFoodComponent,
    TtValueInfo,
    TtPassiveComponent,
    TtBuffComponent,
    TtLvArrayPipe,
    TtRangePipe,
    TtSettingsComponent
  ],
  imports: [
    BrowserModule,
    // AppRoutingModule,  /* FIXME: will be needed for URL-parser */
    BrowserAnimationsModule,
    FlexLayoutModule,
    MaterialModule,
    TtCollapseModule,
    HttpClientModule,
    TtPageLoaderModule,
    FormsModule,
    ReactiveFormsModule,
    TTPopupModule,
  ],
  providers: [FilteredKeyValuePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
