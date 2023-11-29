import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { SkillList, TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';

@Component({
  selector: 'tt-passive',
  templateUrl: './tt-passive.component.html',
  styleUrl: './tt-passive.component.scss'
})
export class TtPassiveComponent {
  passiveSkills$: Observable<SkillList>;

  constructor(private sessionInfo: TTSessionInfoV2Service){
    this.passiveSkills$ = sessionInfo.passiveSkills$.asObservable();
  }
}
