import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatListOption, MatListSubheaderCssMatStyler, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { PopupSetting, TtSettingsService } from './tt-settings.service';

@Component({
  selector: 'tt-settings',
  templateUrl: './tt-settings.component.html',
  styleUrls: ['./tt-settings.component.scss'],
  imports: [MatCard, MatCardContent, MatListSubheaderCssMatStyler, MatSelectionList, MatListOption, AsyncPipe]
})
export class TtSettingsComponent implements OnInit {
  constructor(protected ttSettings: TtSettingsService) { }

  ngOnInit(): void {
  }

  changePopupSetting(ev: MatSelectionListChange) {
    const popupName = ev.options[0].value as keyof PopupSetting;
    this.ttSettings.setPopup(popupName, ev.options[0].selected);
  }
}