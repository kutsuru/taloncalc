import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TTCoreService } from '../core/tt-core.service';
import { MatSelectChange } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { JobDbEntry, SessionChangeEvent } from '../core/models';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { debounce } from '../core/utils';

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

  /* debounced functions */
  public updateStats: () => void;
  public updateClass: (className: string) => void;
  public updateLevel: () => void;

  constructor(private core: TTCoreService, private sessionInfo: TTSessionInfoV2Service, private ref: ChangeDetectorRef) {
    /* create debounced update stats function */
    this.updateStats = debounce(() => {
      this.sessionInfo.changeBaseStats({
        str: this.str,
        agi: this.agi,
        dex: this.dex,
        int: this.int,
        luk: this.luk,
        vit: this.vit
      });
    }, 100);
    /* create debounced update class function */
    this.updateClass = debounce((className: string) => {
      this.sessionInfo.changeClass(className);
    }, 100);
    /* create debounced update level function */
    this.updateLevel = debounce(() => {
      this.sessionInfo.changeLevel(this.baseLevel, this.jobLevel);
    }, 100)
  }

  ngOnInit(): void {
    /* subscribe to session data */
    this.sessionInfo.sessionInfo$
      .pipe(
        this.sessionInfo.eventFilterExcept(SessionChangeEvent.VANILLA_MODE)
      )
      .subscribe((info) => {
        /* levles */
        this.jobLevel = info.data.jobLevel;
        this.baseLevel = info.data.baseLevel;
        this.baseLvlMax = info.data.baseLevelMax;
        this.jobLvlMax = info.data.jobLevelMax;
        if (this.jobLevel > this.jobLvlMax) this.jobLevel = this.jobLvlMax;
        /* stats */
        this.str = info.data.baseStats.str;
        this.agi = info.data.baseStats.agi;
        this.int = info.data.baseStats.int;
        this.vit = info.data.baseStats.vit;
        this.dex = info.data.baseStats.dex;
        this.luk = info.data.baseStats.luk;
        /* bonus stats */
        this.strBonus = info.data.activeBonus.str;
        this.agiBonus = info.data.activeBonus.agi;
        this.intBonus = info.data.activeBonus.int;
        this.vitBonus = info.data.activeBonus.vit;
        this.dexBonus = info.data.activeBonus.dex;
        this.lukBonus = info.data.activeBonus.luk;

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
    /* trigger class change */
    this.updateClass(ev.value);
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
}
