import { Component, OnInit } from '@angular/core';
import { MatLegacySelectionListChange as MatSelectionListChange } from '@angular/material/legacy-list';
import { TTThemerService } from '../tt-themer/tt-themer.service';
import { PopupSetting, TtSettingsService } from './tt-settings.service';

@Component({
  selector: 'tt-settings',
  templateUrl: './tt-settings.component.html',
  styleUrls: ['./tt-settings.component.scss']
})
export class TtSettingsComponent implements OnInit {
  constructor(
    protected themer:TTThemerService,
    protected ttSettings: TtSettingsService
    ) { 

    }

  ngOnInit(): void {
  }

  changePopupSetting(ev: MatSelectionListChange){
    const popupName = ev.options[0].value as keyof PopupSetting;
    this.ttSettings.setPopup(popupName, ev.options[0].selected);
  }
}