import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { KeyValuePipe } from '@angular/common';

type StatsInfoData = {
  "HP": number;
  "SP": number;
  "Hit": number;
  "Flee": number;
  "Perfect Dodge": number;
  "Critical Rate": number;
  "Attack Speed": number;
  "Atk": number;
  "Min-MAtk": number;
  "Max-MAtk": number;
}

@Component({
    selector: 'tt-stats-info',
    templateUrl: './tt-stats-info.component.html',
    styleUrls: ['./tt-stats-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatFormField, MatLabel, MatInput, KeyValuePipe]
})
export class TtStatsInfoComponent implements OnInit {

  public statsInfo: StatsInfoData = {
    "HP": 0,
    "SP": 0,
    "Hit": 0,
    "Flee": 0,
    "Perfect Dodge": 0,
    "Critical Rate": 0,
    "Attack Speed": 0,
    "Atk": 0,
    "Min-MAtk": 0,
    "Max-MAtk": 0
  };

  constructor(private sessionInfo: TTSessionInfoV2Service, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.sessionInfo.sessionInfo$.subscribe((info) => {
      /* session got changes, get new data from session service */
      this.statsInfo = {
        "Attack Speed": this.sessionInfo.aspd,
        "Atk": this.sessionInfo.atk,
        "Critical Rate": this.sessionInfo.crit,
        "Flee": this.sessionInfo.flee,
        "Hit": this.sessionInfo.hit,
        "HP": this.sessionInfo.maxHp,
        "Max-MAtk": this.sessionInfo.maxMatk,
        "SP": this.sessionInfo.maxSp,
        "Min-MAtk": this.sessionInfo.minMatk,
        "Perfect Dodge": this.sessionInfo.perfectDodge
      };
      this.ref.markForCheck();
    })
  }

}
