import { Component, OnInit } from '@angular/core';
import { MatSelectionListChange, MatActionList, MatListSubheaderCssMatStyler, MatListItem, MatSelectionList, MatListOption } from '@angular/material/list';
import { TTThemerService } from '../tt-themer/tt-themer.service';
import { PopupSetting, TtSettingsService } from './tt-settings.service';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatLine } from '@angular/material/core';

@Component({
    selector: 'tt-settings',
    templateUrl: './tt-settings.component.html',
    styleUrls: ['./tt-settings.component.scss'],
    imports: [MatCard, MatCardContent, MatActionList, MatListSubheaderCssMatStyler, NgFor, MatListItem, MatIcon, MatLine, MatSelectionList, MatListOption, AsyncPipe]
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