import { Component, inject, Pipe, PipeTransform } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Pipe({ name: 'levelArray' })
export class LevelArrayPipe implements PipeTransform {
  transform(value: number) {
    return Array.from({ length: value + 1 }, (_, i) => i);
  }
}

@Component({
  selector: 'tt-buff-v3',
  imports: [MatFormFieldModule, MatSelectModule, LevelArrayPipe, MatSlideToggleModule],
  templateUrl: './tt-buff-v3.component.html',
  styleUrl: './tt-buff-v3.component.scss',
})
export class TtBuffV3Component {
  /* injects */
  readonly session = inject(TTSessionInfoV3Service);

  /*** public functions ***/
  updateBuffValue(skillId: number, value: number | boolean) {
    this.session.updateSkillBuff(skillId, value);
  }
}
