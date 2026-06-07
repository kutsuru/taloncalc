import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { TTCoreServiceV3 } from './core/tt-core.v3.service';
import { TtAppHomeComponent } from './tt-app-home/tt-app-home.component';
import { TtAppLoadingComponent } from './tt-app-loading/tt-app-loading.component';
import { TtPopupGroupComponent } from './tt-popup/tt-popup-group.component';
import { TtSettingsService } from './tt-settings/tt-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    TtAppHomeComponent,
    TtAppLoadingComponent
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  readonly ttCoreV3 = inject(TTCoreServiceV3);
  private settingsPopupSub!: Subscription;
  @ViewChild(TtPopupGroupComponent) popupGroup!: TtPopupGroupComponent;
  constructor(protected ttSettings: TtSettingsService) {
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
  }

}