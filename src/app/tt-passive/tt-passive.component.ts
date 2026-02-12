import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { SkillList, TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { TtLvArrayPipe } from '../core/tt-lv-array.pipe';

@Component({
    selector: 'tt-passive',
    templateUrl: './tt-passive.component.html',
    styleUrl: './tt-passive.component.scss',
    standalone: true,
    imports: [MatFormField, MatLabel, MatSelect, MatOption, AsyncPipe, KeyValuePipe, TtLvArrayPipe]
})
export class TtPassiveComponent {
  passiveSkills$: Observable<SkillList>;

  constructor(private sessionInfo: TTSessionInfoV2Service){
    this.passiveSkills$ = sessionInfo.passiveSkills$;
  }

  changePassiveValue(skillName: string, value: number){
    this.sessionInfo.changePassiveBuff(skillName, value);
  }
}
