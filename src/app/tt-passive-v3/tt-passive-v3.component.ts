import { Component, computed, inject, Pipe, PipeTransform, Signal } from '@angular/core';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { LevelArrayPipe } from '../tt-buff-v3/tt-buff-v3.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SkillBuff } from '../core/tt-models.v3';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';

@Pipe({ name: 'booly' })
export class BoolyPipe implements PipeTransform {
  transform(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return (value !== null && value !== 'false');
  }
}

@Component({
  selector: 'tt-passive-v3',
  imports: [MatFormFieldModule, MatSelectModule, LevelArrayPipe, MatSlideToggleModule, BoolyPipe],
  templateUrl: './tt-passive-v3.component.html',
  styleUrl: './tt-passive-v3.component.scss',
})
export class TtPassiveV3Component {
  /* injects */
  readonly session = inject(TTSessionInfoV3Service);
  readonly #core = inject(TTCoreServiceV3);

  /* signals */
  // FIXME: merge bonus and job skills into one to avoid double display
  // FIXME: if skill is already present, somehow ignore / remove it from the "extra" list and just use "max" value in the main list?
  bonusSkills: Signal<SkillBuff[]> = computed(() => {
    const bonusSkills = this.session.bonus().skills;

    let res: SkillBuff[] = [];
    for (const [skillID, level] of bonusSkills.entries()) {
      const skill = this.#core.skillDB.get(skillID)!; // it only is in the map if the skill exsists
      if (!skill.isPassive) continue;
      res.push({
        id: skillID,
        maxLevel: level,
        name: skill.name,
        type: skill.type ?? 'list',
        value: level,
        itemScript: skill.itemScript
      });
    }
    return res;
  });

  /*** public functions ***/
  public updateNumberValue(skillId: number, value: number) {
    this.session.updateSkillPassive(skillId, value);
  }
  public updateBooleanValue(skillId: number, value: boolean) {
    let valAsNumb = value ? 1 : 0;
    this.updateNumberValue(skillId, valAsNumb);
  }
}
