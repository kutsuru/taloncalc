import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe, KeyValuePipe } from '@angular/common';
import { SkillList, TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { SessionChangeEvent } from '../core/models';
import { Observable } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { TtLvArrayPipe } from '../core/tt-lv-array.pipe';

type BuffSkill = {
  type: 'list' | 'check',
  maxLevel: number
}

@Component({
    selector: 'tt-buff',
    templateUrl: './tt-buff.component.html',
    styleUrl: './tt-buff.component.scss',
    standalone: true,
    imports: [MatFormField, MatLabel, MatSelect, MatOption, MatCheckbox, AsyncPipe, KeyValuePipe, TtLvArrayPipe]
})
export class TtBuffComponent implements OnInit {

  buffSkills$: Observable<SkillList>;

  constructor(private sessionInfo: TTSessionInfoV2Service) { 
    this.buffSkills$ = sessionInfo.buffSkills$;
  }

  ngOnInit(): void {
    this.sessionInfo.sessionInfo$
      .pipe(
        this.sessionInfo.eventFilter(
          SessionChangeEvent.CLASS,
          SessionChangeEvent.INIT)
      )
      .subscribe((info) => {
      });

      // TODO: Watch for changes in Buff skills for buff values
  }

  changeBuffValue(skillName: string, value: boolean | number){
    this.sessionInfo.changeActiveBuff(skillName, value);
  }
}
