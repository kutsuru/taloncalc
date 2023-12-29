import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TTCoreService } from '../core/tt-core.service';
import { MatSelectChange } from '@angular/material/select';
import { distinctUntilChanged } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { JobDbEntry, SessionChangeEvent } from '../core/models';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';

@Component({
  selector: 'tt-stats',
  templateUrl: './tt-stats.component.html',
  styleUrls: ['./tt-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtStatsComponent implements OnInit {
  /* classes */
  private _jobClassesAll: string[] = [];
  public jobClasses: string[] = [];
  public selectedClassName: string = "";
  public babyClass: boolean = false;
  private _selectedClass: JobDbEntry | undefined;

  /* levels */
  public maxStats: number[] = Array.from({ length: TTCoreService.MAX_LVL }, (_, i) => i + 1);
  public baseLevel: number = 1;
  public jobLevel: number = 1;
  public baseLvlMax: number = TTCoreService.MAX_LVL;
  public jobLvlMax: number = 1;

  /* stats */
  public str: number = 1;
  public strBonus: number = 0;
  public agi: number = 1;
  public agiBonus: number = 0;
  public vit: number = 1;
  public vitBonus: number = 0;
  public int: number = 1;
  public intBonus: number = 0;
  public dex: number = 1;
  public dexBonus: number = 0;
  public luk: number = 1;
  public lukBonus: number = 0;

  constructor(private core: TTCoreService, private sessionInfo: TTSessionInfoV2Service, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    /* subscribe to session data */
    this.sessionInfo.sessionInfo$
      .pipe(
        this.sessionInfo.eventFilterExcept(SessionChangeEvent.VANILLA_MODE)
      )
      .subscribe((info) => {
        /* levles */
        this.jobLevel = info.jobLevel;
        this.baseLevel = info.baseLevel;
        this.baseLvlMax = info.baseLevelMax;
        this.jobLvlMax = info.jobLevelMax;
        if (this.jobLevel > this.jobLvlMax) this.jobLevel = this.jobLvlMax;
        /* stats */
        this.str = info.baseStats.str;
        this.agi = info.baseStats.agi;
        this.int = info.baseStats.int;
        this.vit = info.baseStats.vit;
        this.dex = info.baseStats.dex;
        this.luk = info.baseStats.luk;
        /* bonus stats */
        this.strBonus = info.activeBonus.str;
        this.agiBonus = info.activeBonus.agi;
        this.intBonus = info.activeBonus.int;
        this.vitBonus = info.activeBonus.vit;
        this.dexBonus = info.activeBonus.dex;
        this.lukBonus = info.activeBonus.luk;

        /* trigger render */
        this.ref.markForCheck();
      });
    /* subscribe to core data */
    this.core.loaded$.pipe(distinctUntilChanged()).subscribe((_) => {
      if (_) {
        /* create class name list */
        this._jobClassesAll = Object.keys(this.core.jobDb);
        this.jobClasses = this._jobClassesAll;
        this.selectedClassName = this.jobClasses[0];
        this._selectedClass = this.core.jobDbV2[this.selectedClassName];
        /* trigger render */
        this.ref.markForCheck();
      }
    });
  }

  /* event observer */
  onClassChange(ev: MatSelectChange) {
    this.selectedClassName = ev.value;
    this._selectedClass = this.core.jobDbV2[ev.value];
    this.sessionInfo.changeClass(ev.value);
  }

  onBabyClassChange(ev: MatCheckboxChange) {
    if (ev.checked) {
      /* filter for baby classes */
      let res: string[] = [];
      for (let job in this.core.jobDbV2) {
        if (!this.core.jobDbV2[job].isTrans) {
          res.push(job);
        }
      }
      this.jobClasses = res;
      /* TODO: check if selected class is still in the list */
    }
    else {
      /* load all classes */
      this.jobClasses = this._jobClassesAll;
    }
  }

  onLevelChange(ev: MatSelectChange) {
    this.sessionInfo.changeLevel(this.baseLevel, this.jobLevel);
  }

  onStatChange(ev: MatSelectChange) {
    this.sessionInfo.changeBaseStats({
      str: this.str,
      agi: this.agi,
      dex: this.dex,
      int: this.int,
      luk: this.luk,
      vit: this.vit
    });
  }
}
