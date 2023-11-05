import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';

type StatsInfoData = {
  maxHp: number;
  maxSp: number;
  hit: number;
  flee: number;
  perfectDodge: number;
  crit: number;
  aspd: number;
  atk: number;
  minMatk: number;
  maxMatk: number;
}

@Component({
  selector: 'tt-stats-info',
  templateUrl: './tt-stats-info.component.html',
  styleUrls: ['./tt-stats-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtStatsInfoComponent implements OnInit {

  public statsInfo: StatsInfoData = {
    aspd: 0,
    atk: 0,
    crit: 0,
    flee: 0,
    hit: 0,
    maxHp: 0,
    maxMatk: 0,
    maxSp: 0,
    minMatk: 0,
    perfectDodge: 0
  };

  constructor(private sessionInfo: TTSessionInfoV2Service, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.sessionInfo.sessionInfo$.subscribe((info) => {
      /* unpack data */
      this.statsInfo = { ...info };
      this.ref.markForCheck();
    })
  }

}
