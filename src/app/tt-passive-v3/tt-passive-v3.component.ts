import { Component, inject, Pipe, PipeTransform } from '@angular/core';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { LevelArrayPipe } from '../tt-buff-v3/tt-buff-v3.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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

  /*** public functions ***/
  public updateNumberValue(skillId: number, value: number) {
    this.session.updateSkillPassive(skillId, value);
  }
  public updateBooleanValue(skillId: number, value: boolean) {
    let valAsNumb = value ? 1 : 0;
    this.updateNumberValue(skillId, valAsNumb);
  }
}
